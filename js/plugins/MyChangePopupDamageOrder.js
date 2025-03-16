/*:
 * @plugindesc 全体攻撃・二刀流実現プラグイン
 * @author paisuygoda
 * @help
 * デフォルトではモーション・アクションが呼ばれた後そのままダメージ表示の処理に移る
 * 全部の処理をキューで管理することでお互いの処理が被らないようになっているが副作用として
 * 全体攻撃をしてもダメージ表示が個別に出てしまうほか、アクション→ダメージ→アクション→ダメージといった処理ができない
 * モーション・アクションとダメージ表示のフェーズを別に管理することでこれらの問題を解決する
 */

(function () {
  var BaMa_initMembers = BattleManager.initMembers;
  BattleManager.initMembers = function () {
    BaMa_initMembers.call(this);
    this._showHelp = false;
    this._forceField = [];
  };

  // startActionではアクションを呼ばない
  BattleManager.startAction = function () {
    var action = this._subject.currentAction();
    this._action = action;
    if (this._action._item._dataClass === "skill") {
      // たたかうが設定されていたら武器に応じたたたかうに切り替え、武器スキル発動の処理も行う
      if (this._action.isAttackSkill() && this._subject.isActor()) {
        var weapon = this._subject.weapons()[0];
        if (
          weapon &&
          weapon.attackSubstitute &&
          Math.random() * 100 < weapon.attackSubstitute["probability"]
        ) {
          this._action.setSkill(weapon.attackSubstitute["skillId"]);
        } else this._action.setAttack();
      }

      var id = this._action._item._itemId;
      // ものまね系だったらものまね対象に切り替え
      if (id === 21) this._action.traceSkill($gameParty._lastActionItem);
      else if (id === 22) this._action.traceSkill($gameTroop._lastActionItem);
      else if (id === 23)
        this._action.traceSkill(BattleManager._lastActionItem);
      else if (id === 24)
        this._action.traceSkill(this._subject._lastActionItem);
      // 擬態だったらその技に切り替え
      else if (id === 112)
        this._action.traceSkill(
          this._action.opponentsUnit().smoothTarget(action._targetIndex).enemy()
            ._mimicSkillId
        );
      // 呼び出すを召喚技にすり替え
      else if (id === 174) this._action.setSkill(167 + Math.randomInt(7));
      // 自然を場所に応じた技にすり替え
      else if (id === 193) this._action.natureSkill(getLocation($dataMap));
      // 実験をその結果に応じた技にすり替え
      else if (id === 213) {
        var trySkill = 33 + Math.randomInt(105);
        // 発明済み調合時は当たり失敗作を使わせる
        if ($gameParty.hasItem($dataItems[trySkill])) {
          if (trySkill % 3 === 1) this._action.setSkill(214);
          else if (trySkill % 3 === 2) this._action.setSkill(215);
          else this._action.setSkill(216);
        }
        // 未発明調合が調合可能時はその技を使わせ、その技を覚える
        else if ($gameParty.canMix($dataItems[trySkill])) {
          this._action.setItem(trySkill);
          $gameParty.gainItem($dataItems[trySkill], 1);
        }
        // それ以外ではハズレ失敗作を使わせる
        else {
          if (trySkill % 3 === 1) this._action.setSkill(217);
          else if (trySkill % 3 === 2) this._action.setSkill(218);
          else this._action.setSkill(219);
        }
      }
      // 踊りを踊り技にすり替え
      else if (id === 220) {
        var skillId = 221 + Math.randomInt(4);
        if (skillId === 221 && this._subject.isStateAffected(116))
          skillId = 224;
        this._action.setSkill(skillId);
      }
      // 祈りは3割失敗する
      else if (id === 234) {
        var prayFailure = Math.random() > 0.7;
        if (prayFailure) this._action.setSkill(235);
      }
    }

    // ものまねスロットに登録
    if (!this._action.item().isSubSkill) {
      var item = this._action._item;
      BattleManager._lastActionItem = item;
      if (this._subject.isActor()) {
        $gameParty._lastActionItem = item;
        this._subject._lastActionItem = item;
      } else $gameTroop._lastActionItem = item;
    }
    this._action.splitActions();
    this._subject.useItem(action.item());
    this._action.applyGlobal();
    this.refreshStatus();
    this._logWindow.displayAction(this._subject, action.item());
  };

  // 地形設定(0:平原、1:森林、2:砂漠、3:街中、4:山、5:海、6:洞窟、7:雪、8:無)
  getLocation = function (map) {
    var noteLocation = /<(?:Location):[ ](\d+)>/i;
    var noteLocation2 = /<(?:Location):[ ](\d+)[ ](\d+)>/i;
    var notedata = map.note.split(/[\r\n]+/);

    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(noteLocation2) && $gamePlayer.regionId() === RegExp.$2) {
        return parseInt(RegExp.$1);
      } else if (line.match(noteLocation)) {
        return parseInt(RegExp.$1);
      }
    }
    return 0;
  };

  // actionとdamageは完全に分ける
  BattleManager.update = function () {
    if (!this.isBusy() && !this.updateEvent()) {
      switch (this._phase) {
        case "start":
          this.startInput();
          break;
        case "turn":
          this.updateTurn();
          break;
        case "action":
          this.updateAction();
          break;
        case "damage":
          this.updateDamage();
          break;
        case "postDamage":
          this.updatePostDamage();
          break;
        case "specialDamage":
          this.updateSpecialDamage();
          break;
        case "turnEnd":
          this.updateTurnEnd();
          break;
        case "battleEnd":
          this.updateBattleEnd();
          break;
      }
    }
  };

  // 特殊行動がある時はそちらを優先
  /* MPP_ActiveTimeBattleに統合
	BattleManager.updateTurn = function() {
		$gameParty.requestMotionRefresh();
		if (this._specialSkills.length > 0) {
			this._special = this._specialSkills.shift();
			var oracleSkill = $dataSkills[this._special[skillId]];
			var targets = this._special[targets];
			this._logWindow.showNormalAnimation(targets, oracleSkill.animationId);
			this._phase = 'specialDamage';
		} else {
			if (!this._subject) {
				this._subject = this.getNextSubject();
			}
			if (this._subject) {
				this.processTurn();
			} else {
				this.endTurn();
			}
		}
	};
	*/

  // Actionがたたかう派生系であることの確認
  Game_Action.prototype.applyDualWield = function () {
    var attackskills = [
      1, 11, 12, 13, 14, 15, 16, 17, 18, 19, 27, 198, 271, 272, 273, 279,
    ];
    return (
      this._item._dataClass == "skill" &&
      (attackskills.contains(this._item._itemId) ||
        (this._item._itemId === 100 &&
          attackskills.contains($dataSkills[100].origin)))
    );
  };

  // 二刀流の場合にはこのタイミングでアクションを分割
  BattleManager.updateAction = function () {
    if (!this._logWindow.isBusy()) {
      // 魔封剣状態のキャラがいる場合、魔法系スキルは吸収スキルにすり替え
      if (this._action.isMagical() && this._action.item().stypeId != 4) {
        var members = this.allBattleMembers();
        var index = -1;
        for (var i = 0; i < members.length; i++) {
          if (members[i].isStateAffected(73)) {
            index = i;
            break;
          }
        }
        if (index > -1) {
          // 吸収スキルに元スキルの情報を詰める
          var item = this._action.item();
          $dataSkills[131].name = item.name;
          $dataSkills[131].description = item.id;
          $dataSkills[131].mpCost = item.mpCost;
          $dataSkills[131].animationId = item.animationId;
          // ステータス付与/除去、回復魔法はMP吸収効果をセットする
          if ([1, 5].contains(item.damage.type)) {
            $dataSkills[131].damage.type = 0;
            $dataSkills[131]._damagePopUp = false;
          } else {
            $dataSkills[131].damage.type = 4;
            $dataSkills[131]._damagePopUp = true;
          }
          $dataSkills[131].damage.elementId = item.damage.elementId;
          $dataSkills[131]._damagePopUp = item._damagePopUp;
          $dataSkills[131].isUlt = item.isUlt;
          this._action.setSkill(131);
          this._action._forceTarget = members[index];
          members[index].startAnimation(190, false, 0);
        }
      }

      // ._targetsと._reflecTargetsに対象を詰める
      this.substituteBeforeAnim();
      // Actionがたたかう派生系であることの確認
      if (this._subject.isActor() && this._action.applyDualWield()) {
        const bareHands = this._subject.isBareHands();
        if (!this._dualWielding && (this._subject.weapons()[1] || bareHands)) {
          this._dualWielding = true;
          if(!bareHands) {
            this._tempWeapon = this._subject._equips[1];
            this._subject._equips[1] = null;
          }
          var nextAction = JsonEx.makeDeepCopy(this._action);
          this._action.insert(nextAction);
        } else if (this._dualWielding && !bareHands) {
          this._subject._equips[1] = this._tempWeapon;
          this._tempWeapon = this._subject._equips[0];
          this._subject._equips[0] = null;
        }
      }
      this._logWindow.startAction(
        this._subject,
        this._action,
        this._targets,
        this._reflectTargets
      );
      this._phase = "damage";
    }
  };

  // リフレク状態によってtargetsを分割
  // かばうによるものを含めて、スキルアニメーションが表示される前に真のtargetを決めることで描画に矛盾をなくす
  BattleManager.substituteBeforeAnim = function () {
    if (this._action.isMagical()) {
      rawTargets = this._action.makeTargets();
      this._targets = [];
      this._reflectTargets = [];
      var item = this._action.item();
      rawTargets.forEach(function (rawTarget) {
        var target = BattleManager.applySubstitute(rawTarget);
        if (target.isStateAffected(21) && !item.passReflec)
          BattleManager._reflectTargets.push(target);
        else BattleManager._targets.push(target);
      });

      // リフレク者が一人でもいれば反射先を選定しtargetに加える
      // リフレクアニメと反射後の攻撃アニメが同時に流れる
      if (this._reflectTargets.length > 0) {
        this._reflectTargets.forEach(function (target) {
          var substitute = target.opponentsUnit().randomTarget();
          if (substitute) BattleManager._targets.push(substitute);
        });
      }
    } else {
      this._targets = [];
      this._action.makeTargets().forEach(function (rawTarget) {
        BattleManager._targets.push(BattleManager.applySubstitute(rawTarget));
      });
      this._reflectTargets = [];
    }
  };

  BattleManager.updateDamage = function () {
    if (this._waitAnim > 0) this._waitAnim--;
    if (!(this._logWindow.isBusy() || this._subject._isInMotion)) {
      var target = this._targets.shift();
      while (target) {
        this.invokeAction(this._subject, target);
        target._reservedRecover = 0;
        target = this._targets.shift();
      }
      // 対象の在不在にかかわらず実行する特殊処理
      this._action.applyNoTargetSpecialSkills();

      if (this._subject.isActor() && this._dualWielding && this._subject._equips[0]._itemId === 0) {
        // ここのfalse消してもよさそう
        this._dualWielding = false;
        this._subject._equips[0] = this._tempWeapon;
      }

      this._resettingSubject = this._subject;
      // 二段階スキルなら二段階目のスキルをpushしsubjectを行動前待機状態に戻す
      if (this._action.item().isSerialSkill) {
        var secondAction = JsonEx.makeDeepCopy(this._action);
        secondAction.setSkill(this._action._item._itemId + 1);
        this._subject._actions.push(secondAction);
        this._subject.onMadeActionSubSkill(secondAction);
        this._subject = null;

        // BattleManagerにserialSkill情報を渡す（クイック時endActionでクイックのターン数を消費させないため）
        this._isInstantSkill = true;
      }

      // 描画時間の引き延ばし(ぬすむ系で盗んだアイテムを見る時間猶予)
      if (this._action.item().isStealSkill) this._waitAnim = 30;

      // スキル使用後にコストを払うスキルの処理
      this._subject.payPostSkillCost(this._action.item());

      this._action = this._action.pop();
      if (this._action) this._phase = "action";
      else this._phase = "postDamage";
    }
  };

  // 宣告や予言など、subjectの絡まないダメージ処理
  BattleManager.updateSpecialDamage = function () {
    if (this._waitAnim > 0) this._waitAnim--;
    if (!this._logWindow.isBusy()) {
      var oracleSkill = $dataSkills[this._special["skillId"]];
      var targets = this._special["targets"];

      targets.forEach(function (target) {
        BattleManager.updateIndividualSpecialDamage(target, oracleSkill);
      });

      this._special = null;
      this._phase = "turn";
    }
  };

  BattleManager.updatePostDamage = function () {
    if (this._waitAnim > 0) this._waitAnim--;
    else if (!this._logWindow.isBusy()) {
      if (this._subject.isActor() && this._subject.isBareHands()) {
        this._dualWielding = false;
      }
      this.endAction();
      this._phase = "turn";
    }
  };

  BattleManager.updateIndividualSpecialDamage = function (target, oracleSkill) {
    if (oracleSkill.damage.type > 0) {
      try {
        var b = target;
        var sign = [3, 4].contains(oracleSkill.damage.type) ? -1 : 1;
        var baseValue = Math.max(eval(oracleSkill.damage.formula), 0);
        if (isNaN(baseValue)) baseValue = 0;
        baseValue *=
          ((Math.random() * 2 * oracleSkill.damage.variance +
            100 -
            oracleSkill.damage.variance) /
            100) *
          sign;
      } catch (e) {
        baseValue = 0;
      }
      value = baseValue * target.elementRate(oracleSkill.damage.elementId);

      if (baseValue < 0) {
        value *= target.rec;
      } else {
        // 魔法攻撃のみ想定
        value *= target.mdr;
      }
      value /= value > 0 && target.isGuard() ? 2 * target.grd : 1;
      value = Math.round(value);
      target.result().clear();
      target.gainHp(-value);
      target.result().success = true;
      this._logWindow.push("popupDamage", target);
    }
    oracleSkill.effects.forEach(function (effect) {
      this.applySpecialSkillEffect(target, effect);
    }, this);
    if (this._special["origin"] === "oracle") target.removeState(14);
    else if (this._special["origin"] === "rerise") {
      target.removeState(1);
      target.removeState(33);
    }
    this._logWindow.displayAffectedStatus(target);
  };

  BattleManager.applySpecialSkillEffect = function (target, effect) {
    var chance = effect.value1;
    switch (effect.code) {
      case Game_Action.EFFECT_ADD_STATE:
        chance *= target.stateRate(effect.dataId);
        if (Math.random() < chance) {
          target.addState(effect.dataId);
        }
        break;
      case Game_Action.EFFECT_REMOVE_STATE:
        if (Math.random() < chance) {
          target.removeState(effect.dataId);
        }
        break;
    }
  };

  Window_BattleLog.prototype.displayOracleResults = function (target) {
    this.push("popupDamage", target);
  };

  // Game_Actionをキューに
  var GaAc_initialize = Game_Action.prototype.initialize;
  Game_Action.prototype.initialize = function (subject, forcing) {
    GaAc_initialize.call(this, subject, forcing);
    this._nextAction = null;
    this._turnFrame = 0;
    this._counter = false;
    this._oracleAction = false;
  };

  Game_Action.prototype.push = function (lastAction) {
    if (this._nextAction) {
      this._nextAction.push(lastAction);
    } else {
      this._nextAction = lastAction;
    }
  };

  Game_Action.prototype.pop = function () {
    return this._nextAction;
  };

  Game_Action.prototype.insert = function (action) {
    if (this._nextAction) action._nextAction = this._nextAction;
    this._nextAction = action;
  };

  Game_Action.prototype.splitActions = function () {
    if (this.item().scope > 3 && this.item().scope < 7) {
      var num = this.numTargets();
      $dataSkills[100] = JsonEx.makeDeepCopy(this.item());
      $dataSkills[100].scope = 3;
      $dataSkills[100].origin = this._item._itemId;
      this._item._itemId = 100;

      for (var i = 1; i < num; i++) {
        var nextAction = JsonEx.makeDeepCopy(this);
        nextAction._nextAction = null;
        this.push(nextAction);
      }
    }
  };

  // 通常消滅エフェクトの敵の場合同時撃破時には同時に消える
  Sprite_Enemy.prototype.isEffecting = function () {
    return this._effectType !== null && this._effectType !== "collapse";
  };

  // バトルログ処理による遅延をできるだけ減らす
  Window_BattleLog.prototype.push = function (methodName) {
    var methodArgs = Array.prototype.slice.call(arguments, 1);
    switch (methodName) {
      case "addText":
      case "pushBaseLine":
      case "waitForNewLine":
      case "popBaseLine":
        break;
      case "popupDamage":
        methodArgs[0].startDamagePopup();
        break;
      case "performMiss":
        methodArgs[0].performMiss();
        break;
      case "performEvasion":
        methodArgs[0].performEvasion();
        break;
      case "performMagicEvasion":
        methodArgs[0].performMagicEvasion();
        break;
      case "performDamage":
        methodArgs[0].performDamage();
        break;
      case "performCollapse":
        methodArgs[0].performCollapse();
        break;
      default:
        this._methods.push({ name: methodName, params: methodArgs });
    }
  };

  // アクションごとには技名は表示しない / アニメーション処理の後にフェーズチェンジ
  Window_BattleLog.prototype.startAction = function (
    subject,
    action,
    targets,
    reflectTargets
  ) {
    var item = action.item();
    this.push("performActionStart", subject, action);
    this.push("waitForMovement");
    this.push("performAction", subject, action);
    this.push("waitForEffect");
    // リフレク表示
    this.push("showAnimation", subject, reflectTargets.clone(), 123);
    if (
      item.animationId === 221 &&
      [2, 3].contains(action.item()._thrownWeapon.id)
    )
      this.push("showAnimation", subject, targets.clone(), 253);
    else this.push("showAnimation", subject, targets.clone(), item.animationId);
    this.push("waitPhase");
    // this.displayAction(subject, item);
  };

  Window_BattleLog.prototype.waitPhase = function () {
    if (BattleManager._waitAnim > 0) {
      this._methods.unshift({ name: "waitPhase", params: [] });
    }
    BattleManager.updateDamage();
  };

  // モーション中の情報を埋め込む
  var GaAc_initMembers = Game_Actor.prototype.initMembers;
  Game_Actor.prototype.initMembers = function () {
    this._isInMotion = false;
    GaAc_initMembers.call(this);
  };

  // アクターの動きを細かく設定する
  Game_Actor.prototype.performAction = function (action) {
    Game_Battler.prototype.performAction.call(this, action);
    this._isInMotion = true;
    if (action.isAttackSkill()) {
      this.performAttack();
    } else if (action.isGuard()) {
      this.requestMotion("guard");
      this._isInMotion = false;
    } else if (action.isMagicSkill()) {
      this.requestMotion("spell");
    } else if (action.isSkill()) {
      this.requestMotion("skill");
    } else if (action.isItem()) {
      this.requestMotion("item");
    }
  };

  Game_Actor.prototype.attackAnimationId2 = function () {
    if (this.hasNoWeapons()) {
      return this.bareHandsAnimationId();
    } else {
      var weapons = this.weapons();
      return weapons[1] ? weapons[1].animationId : 0;
    }
  };
})();
