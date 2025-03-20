/*:
 * @plugindesc 細かなプラグイン集
 * @author paisuygoda
 * @help 本体js編集用
 */

(function () {
  // エンカウント率調整 n-(n+10)歩でエンカウント
  Game_Player.prototype.makeEncounterCount = function () {
    var n = $gameMap.encounterStep();
    this._encounterCount = Math.randomInt(10) + n;
  };

  // 戦闘開始時メッセージ省略
  BattleManager.displayStartMessages = function () {};

  // 戦闘終了後メッセージ表示短縮
  BattleManager.displayExp = function () {
    var exp = this._rewards.exp;
    if (exp > 0) {
      var text = TextManager.obtainExp.format(exp, TextManager.exp);
      $gameMessage.add("\\.\\>" + text);
    }
  };
  BattleManager.displayGold = function () {
    var gold = this._rewards.gold;
    if (gold > 0) {
      $gameMessage.add("\\>" + TextManager.obtainGold.format(gold));
    }
  };
  BattleManager.displayDropItems = function () {
    var items = this._rewards.items;
    if (items.length > 0) {
      $gameMessage.newPage();
      items.forEach(function (item) {
        $gameMessage.add("\\>" + TextManager.obtainItem.format(item.name));
      });
    }
  };

  // パーティーコマンドからたたかうを削除
  Window_PartyCommand.prototype.makeCommandList = function () {
    this.addCommand(
      TextManager.escape,
      "escape",
      BattleManager.processEscape()
    );
  };

  // アビリティは防具に数えない
  Window_ItemList.prototype.includes = function (item) {
    switch (this._category) {
      case "item":
        return DataManager.isItem(item) && item.itypeId === 1;
      case "weapon":
        return DataManager.isWeapon(item);
      case "armor":
        return DataManager.isArmor(item) && item.etypeId != 6;
      case "keyItem":
        return DataManager.isItem(item) && item.itypeId === 2;
      default:
        return false;
    }
  };

  // 敵にもレベル導入
  Game_Enemy.prototype.setup = function (enemyId, x, y) {
    this._enemyId = enemyId;
    this._screenX = x;
    this._screenY = y;
    this._level = $dataEnemies[enemyId].level;
    this.rat = $dataEnemies[enemyId].rate;
    this.mrt = $dataEnemies[enemyId].mrate;
    this.cursorX = $dataEnemies[enemyId].cursorX;
    this.cursorY = $dataEnemies[enemyId].cursorY;
    this.recoverAll();
  };

  /*
	// 敵の行動時光る
	Sprite_Enemy.prototype.startWhiten = function() {
		this._effectDuration = 24;
	};
	Sprite_Enemy.prototype.updateWhiten = function() {
		if (this._effectDuration > 8) {
			if (this._effectDuration % 8 > 4) this.setBlendColor([255, 255, 255, 255]);
			else this.setBlendColor([0, 0, 0, 255]);
		} else {
				this.setBlendColor([0, 0, 0, 0]);
		}
	};
	*/
  // 敵の行動時光る
  Sprite_Enemy.prototype.startWhiten = function () {
    this._effectDuration = 30;
  };
  Sprite_Enemy.prototype.updateWhiten = function () {
    if (this._effectDuration > 10 && this._effectDuration % 10 > 5) {
      this.setBlendColor([255, 255, 255, 255]);
      var glowFilter = new PIXI.filters.GlowFilter(4, 4, 4, 0x000000);
      this.filters = [glowFilter];
    } else {
      this.setBlendColor([0, 0, 0, 0]);
      this.filters = [];
    }
  };

  //スキルのダメージ表示設定読み込み
  var _loaded_DamagePopUp_Setting = false;
  var DaMaSkill_isDatabaseLoaded = DataManager.isDatabaseLoaded;
  DataManager.isDatabaseLoaded = function () {
    if (!DaMaSkill_isDatabaseLoaded.call(this)) return false;
    if (!_loaded_DamagePopUp_Setting) {
      this.processNotetagsDamagePopUp($dataSkills);
      this.processNotetagsDamagePopUp($dataItems);
      this.processNotetagsHalfEvasion($dataSkills);
      _loaded_DamagePopUp_Setting = true;
    }
    return true;
  };
  DataManager.processNotetagsDamagePopUp = function (group) {
    var noteCounter = /<(?:DamageNotPopUp)>/i;
    for (var n = 1; n < group.length; n++) {
      var obj = group[n];
      var notedata = obj.note.split(/[\r\n]+/);

      obj._damagePopUp = true;
      for (var i = 0; i < notedata.length; i++) {
        var line = notedata[i];
        if (line.match(noteCounter)) {
          obj._damagePopUp = false;
        }
      }
    }
  };
  // 相手の回避率半減で計算する特徴を作成
  DataManager.processNotetagsHalfEvasion = function (group) {
    var noteHalfEva = /<(?:HalfEvasion)>/i;
    for (var n = 1; n < group.length; n++) {
      var obj = group[n];
      var notedata = obj.note.split(/[\r\n]+/);

      obj._halfEva = false;
      for (var i = 0; i < notedata.length; i++) {
        var line = notedata[i];
        if (line.match(noteHalfEva)) {
          obj._halfEva = true;
        }
      }
    }
  };
  // 瀕死攻撃などではダメージ表示しない
  BattleManager.invokeNormalAction = function (subject, target) {
    this._action.apply(target);
    if (!this._action.item()._damagePopUp) {
      // 死亡描画だけは行う
      if (target.result().addedStateObjects().indexOf($dataStates[1]) >= 0) {
        target.performCollapse();
      }
      target.result().hpAffected = false;
      target.result().mpDamage = 0;
    }
    this._logWindow.displayActionResults(subject, target);
  };

  // 宣告の読み込み
  var _loaded_Oracle_Setting = false;
  var DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
  DataManager.isDatabaseLoaded = function () {
    if (!DaMa_isDatabaseLoaded.call(this)) return false;
    if (!_loaded_Oracle_Setting) {
      this.processNotetagsOracle($dataSkills);
      _loaded_Oracle_Setting = true;
    }
    return true;
  };
  DataManager.processNotetagsOracle = function (group) {
    var noteOracle = /<(?:OracleSkill):[ ](\d+)>/i;
    for (var n = 1; n < group.length; n++) {
      var obj = group[n];
      var notedata = obj.note.split(/[\r\n]+/);

      obj._oracleSkill = false;

      for (var i = 0; i < notedata.length; i++) {
        var line = notedata[i];
        if (line.match(noteOracle)) {
          obj._oracleSkill = parseInt(RegExp.$1);
        }
      }
    }
  };

  // 味方をもう少し右端へ寄せる
  Sprite_Actor.prototype.setActorHome = function (index) {
    this.setHome(650 + index * 20, 250 + index * 56);
  };

  // Sprite_Actorに1フレーム1ピクセルでは速すぎる動きの隔Xフレーム判断用にclockを仕込む
  Sprite_Actor.prototype.update = function () {
    Sprite_Battler.prototype.update.call(this);
    this.updateShadow();
    this.updateClock();
    if (this._actor) {
      this.updateMotion();
    }
  };
  Sprite_Actor.prototype.updateClock = function () {
    if (++this._clock === 60) this._clock = 0;
  };

  // 敵にダメージ与えた時の点滅をなくす
  Game_Enemy.prototype.performDamage = function () {
    Game_Battler.prototype.performDamage.call(this);
    SoundManager.playEnemyDamage();
    // this.requestEffect('blink');
  };

  // 戦闘不能者対象の技が生存者に当たった場合、デフォルトでは戦闘不能者にターゲットをずらすが
  // そのまま生存者に当てるよう変更(アンデッドに蘇生技を当てるため)
  Game_Action.prototype.targetsForFriends = function () {
    var targets = [];
    var unit = this.friendsUnit();
    if (this.isForUser()) {
      return [this.subject()];
    } else if (this.isForRandom()) {
      for (var i = 0; i < this.numTargets(); i++) {
        targets.push(unit.randomTarget());
      }
    } else if (this.isForDeadFriend()) {
      if (this.isForOne()) {
        //targets.push(unit.smoothDeadTarget(this._targetIndex));
        targets.push(unit.members()[this._targetIndex]);
      } else {
        targets = unit.deadMembers();
      }
    } else if (this.isForOne()) {
      if (this._targetIndex < 0) {
        targets.push(unit.randomTarget());
      } else {
        targets.push(unit.smoothTarget(this._targetIndex));
      }
    } else {
      targets = unit.aliveMembers();
    }
    return targets;
  };

  // かくれるorジャンプ中の味方にカーソルを合わせない
  Window_BattleActor.prototype.cursorUp = function (wrap) {
    var index = this.index();
    var maxItems = this.maxItems();
    var maxCols = this.maxCols();
    if (index >= maxCols || (wrap && maxCols === 1)) {
      for (var i = 0; i < maxItems; i++) {
        index = (index - maxCols + maxItems) % maxItems;
        this.select(index);
        if (
          !(
            this.actor().isStateAffected(32) || this.actor().isStateAffected(78)
          )
        )
          break;
      }
    }
  };
  Window_BattleActor.prototype.cursorDown = function (wrap) {
    var index = this.index();
    var maxItems = this.maxItems();
    var maxCols = this.maxCols();
    if (index < maxItems - maxCols || (wrap && maxCols === 1)) {
      for (var i = 0; i < maxItems; i++) {
        index = (index + maxCols) % maxItems;
        this.select(index);
        if (
          !(
            this.actor().isStateAffected(32) || this.actor().isStateAffected(78)
          )
        )
          break;
      }
    }
  };

  // 敵のレビテト・小人はアイコン表示しない
  Game_Enemy.prototype.stateIcons = function () {
    return this.states()
      .map(function (state) {
        if ([13, 22].contains(state.id)) return 0;
        return state.iconIndex;
      })
      .filter(function (iconIndex) {
        return iconIndex > 0;
      });
  };

  // 接地技リスト
  var surfaceSkills = [154, 203, 262, 275];

  // targetへのアニメーション表示は行いつつダメージ計算は行わない場合ここに書く
  Game_Action.prototype.testApply = function (target) {
    // レビテト者が接地技を食らったらアニメーションは表示しつつそれを無効にする(接地技は手書きで指定、一部地属性技はレビテト回避されると不自然なため)
    if (
      target.isStateAffected(22) &&
      surfaceSkills.contains(this._item._itemId)
    )
      return false;
    return (
      // 戦闘不能者対象の技が生存者にもあたる（アンデッドに蘇生技を当てるため）
      (this.isForDeadFriend() === target.isDead() || this.isForDeadFriend()) &&
      ($gameParty.inBattle() ||
        this.isForOpponent() ||
        (this.isHpRecover() && target.hp < target.mhp) ||
        (this.isMpRecover() && target.mp < target.mmp) ||
        this.hasItemAnyValidEffects(target))
    );
  };

  Game_Action.prototype.isGuard = function () {
    return (
      this.item() === $dataSkills[this.subject().guardSkillId()] ||
      // 防御だけでなく守りでも防御アクションを表示
      this.item() === $dataSkills[25] ||
      this.subject().isStateAffected(39)
    );
  };
  Game_BattlerBase.prototype.isGuard = function () {
    return (
      this.canMove() &&
      (this.specialFlag(Game_BattlerBase.FLAG_ID_GUARD) ||
        // 防御だけでなく守りでも防御モーションを表示
        this.isStateAffected(39))
    );
  };

  // 連続魔法の時アクションを二つ持つ
  Game_Actor.prototype.makeActionTimes = function () {
    return this.addedSkillTypes().some(function (skillId) {
      return skillId === 34;
    })
      ? 2
      : 1;
  };

  // 追加効果のステートと表示するアニメーションの対応表
  convertStateIdToAnimationId = function (stateId) {
    switch (stateId) {
      case 4:
        return 59;
      case 5:
        return 320;
      case 6:
        return 61;
      case 10:
        return 62;
      case 17:
        return 205;
      case 29:
        return 103;
      case 37:
        return 65;
      default:
        return 0;
    }
  };

  Game_Action.prototype.itemEffectAddAttackState = function (target, effect) {
    this.subject()
      .attackStates()
      .forEach(
        function (stateId) {
          var chance = effect.value1;
          chance *= target.stateRate(stateId);
          chance *= this.subject().attackStatesRate(stateId);
          chance *= this.lukEffectRate(target);
          if (Math.random() < chance) {
            target.addState(stateId);
            this.makeSuccess(target);
            // 通常攻撃に武器固有の追加効果が発動した場合、そのアニメーションも表示
            var animationId = convertStateIdToAnimationId(stateId);
            target.startAnimation(
              animationId,
              target.isActor(),
              BattleManager._waitAnim
            );
          }
        }.bind(this),
        target
      );
  };

  // スキル選択画面でキャンセルした場合連続魔選択状況をリセットする
  Scene_Battle.prototype.onSkillCancel = function () {
    this._skillWindow.hide();
    this._actorCommandWindow.activate();
    BattleManager.actor()._actionInputIndex = 0;
    this._inSerialMagic = false;
  };

  // 特定スキルタイプはアイテムウィンドウの方を開く
  Scene_Battle.prototype.commandSkill = function () {
    var stype = this._actorCommandWindow.currentExt();
    var itemSkills = [9, 12, 14, 31, 32, 33, 35];
    if (itemSkills.contains(stype)) {
      var itemType = this.convertToItemType(stype);
      this._itemWindow._type = itemType["type"];
      this._itemWindow._level = itemType["level"];
      this._itemWindow.refresh();
      this._itemWindow.show();
      this._itemWindow.activate();
    } else {
      this._skillWindow.setActor(BattleManager.actor());
      this._skillWindow.setStypeId(stype);
      this._skillWindow.refresh();
      this._skillWindow.show();
      this._skillWindow.activate();
    }
  };
  Scene_Battle.prototype.commandItem = function () {
    this._itemWindow._type = 0;
    this._itemWindow._level = 3;
    this._itemWindow.refresh();
    this._itemWindow.show();
    this._itemWindow.activate();
  };

  Scene_Battle.prototype.convertToItemType = function (stype) {
    switch (stype) {
      case 9:
        return { type: 9, level: 3 };
      case 12:
        return { type: 12, level: 3 };
      case 14:
        return { type: 14, level: 3 };
      case 31:
        return { type: 14, level: 1 };
      case 32:
        return { type: 14, level: 2 };
      case 33:
        return { type: 9, level: 2 };
      case 35:
        return { type: 35, level: 3 };
    }
  };

  // 行動を決定したとき、既に入っているアクション内容は消さない
  // ジャンプ→着地などの二段階スキルのため
  Game_Battler.prototype.makeActions = function () {
    if (this.canMove()) {
      var actionTimes = this.makeActionTimes();
      for (var i = 0; i < actionTimes; i++) {
        this._actions.push(new Game_Action(this));
      }
    }
  };

  // endActionはthis._subjectではなく引数に入ったsubjectを入れる
  // subSkillの文脈ではどうしてもupdateturnで次アクションを選び始める前（この処理が走る前）にthis._subjectがnullであってほしいため
  BattleManager.endAction = function () {
    this._logWindow.endAction(this._resettingSubject);
    if (this._resettingSubject._ultCount > 0)
      this._resettingSubject._ultCount--;

    if (
      !this._isInstantSkill &&
      this.isUnderQuick() &&
      this._quickActor._quick-- <= 0
    ) {
      this._quickActor.removeState(50);
    }
    this._isInstantSkill = false;
    this._phase = "turn";
  };

  // 連続魔を選んだ時に独自処理に回す
  Window_SkillList.prototype.makeItemList = function () {
    if (this._actor) {
      if ([9, 12, 14].contains(this._stypeId)) {
        this._data = $gameParty.allItems().filter(function (item) {
          return this.includesItem(item);
        }, this);
      } else if (this._stypeId === 34) {
        this._data = [];
        var skills = this._actor.addedSkillTypes();
        for (var i = 0; i < skills.length; i++) {
          if (skills[i] === 34) continue;

          if (skills[i] < 15) {
            this._stypeId = skills[i];
            this._skillLevel = 3;
          } else {
            this._stypeId = this.convertSkillType(skills[i]);
            if (stypeId % 2 == 1) this._skillLevel = 1;
            else this._skillLevel = 2;
          }

          if ([1, 2, 3, 4, 6].contains(this._stypeId)) {
            this._data = this._data.concat(
              this._actor.skills().filter(function (item) {
                return this.includes(item);
              }, this)
            );
          }
        }
        this._stypeId = 34;
      } else {
        this._data = this._actor.skills().filter(function (item) {
          return this.includes(item);
        }, this);
      }
    } else {
      this._data = [];
    }
  };

  // 敵消滅を早く
  Sprite_Enemy.prototype.startCollapse = function () {
    this._effectDuration = 16;
    this._appeared = false;
  };
  // 敵消滅時、黒くなる
  Sprite_Enemy.prototype.updateCollapse = function () {
    this.blendMode = Graphics.BLEND_ADD;
    this.setBlendColor([90, 0, 90, 128]);
    this.opacity *= this._effectDuration / (this._effectDuration + 1);
  };

  // 機械は手前に置く
  Sprite_Weapon.prototype.setup = function (weaponImageId) {
    this._weaponImageId = weaponImageId;
    this._animationCount = 0;
    this._pattern = 0;
    this.loadBitmap();
    this.updateFrame();
    if ([8, 9].contains(weaponImageId)) this.x = -32;
    else this.x = -16;
  };

  // ダメージを受けたらステート解除するのは物理技のときに限る
  //　暗にGame_Battler.prototype.onDamage を一切呼ばなくなっている
  Game_Action.prototype.executeHpDamage = function (target, value) {
    if (this.isDrain()) {
      value = Math.min(target.hp, value);
    }
    this.makeSuccess(target);
    target.gainHp(-value);
    if (value > 0 && this.isPhysical()) {
      target.removeStatesByDamage();
    }
    this.gainDrainedHp(value);

    // 竜剣はMPも吸う
    if (this.item().id === 201) {
      value = Math.floor(Math.min(target.mp, value / 5));
      target.gainMp(-value);
      this.subject().gainMp(value);
    }
  };

  MyMiPl_GaAc_clear = Game_ActionResult.prototype.clear;
  Game_ActionResult.prototype.clear = function () {
    MyMiPl_GaAc_clear.call(this);
    this.protected = false;
  };

  // 計算ごとにresultを消去する処理を削除。どうせひとまとまりの計算ごとには消去されるのと、subjectのダメージ量を保持しておかないと描画に影響が出るため
  Game_Action.prototype.apply = function (target) {
    var result = target.result();
    // this.subject().clearResult();
    // result.clear();
    result.used = this.testApply(target);
    result.missed = result.used && Math.random() >= this.itemHit(target);
    result.evaded = !result.missed && Math.random() < this.itemEva(target);
    result.physical = this.isPhysical();
    result.drain = this.isDrain();
    if (result.isHit()) {
      if (this.item().damage.type > 0) {
        result.critical = Math.random() < this.itemCri(target);
        var value = this.makeDamageValue(target, result.critical);
        if (this.isPhysical() && this.isForOne() && $gameParty._golemHp > 0) {
          $gameParty._golemHp = Math.max($gameParty._golemHp - value, 0);
          this.makeSuccess(target);
          target._result.hpDamage += value;
          target._result.hpAffected = true;
          target._result.protected = true;
        } else {
          this.executeDamage(target, value);
        }
      }
      if (!result.protected) {
        this.item().effects.forEach(function (effect) {
          this.applyItemEffect(target, effect);
        }, this);
        this.applyItemUserEffect(target);
      }

      // 特殊スキルの効果処理(MySpecialSkill)
      this.applySpecialSkills(target);
    }
  };

  // ダメージスプライトにゴーレムの手を設定
  Sprite_Damage.prototype.setup = function (target) {
    if (target.result().protected) {
      var sprite = new Sprite();
      sprite.bitmap = ImageManager.loadSystem("golem");
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 1;
      sprite.y = -40;
      sprite.ry = sprite.y;
      sprite.isGolem = true;
      this.addChild(sprite);
      sprite.setFrame(0, 0, 100, 112);
      sprite.y = 25;
    }
    var result = target.result();
    if (result.missed || result.evaded) {
      this.createMiss();
    } else if (result.hpAffected) {
      this.createDigits(0, result.hpDamage);

      // HP&MP双方に影響があった場合
      if (target.isAlive() && result.mpDamage !== 0) {
        this.createDigits(2, result.mpDamage, -32);
      }
    } else if (target.isAlive() && result.mpDamage !== 0) {
      this.createDigits(2, result.mpDamage);
    }
    if (result.critical) {
      this.setupCriticalEffect();
    }
  };

  Sprite_Damage.prototype.createDigits = function (
    baseRow,
    value,
    baseHeight = 0
  ) {
    var string = Math.abs(value).toString();
    var row = baseRow + (value < 0 ? 1 : 0);
    var w = this.digitWidth();
    var h = this.digitHeight();
    for (var i = 0; i < string.length; i++) {
      var sprite = this.createChildSprite();
      var n = Number(string[i]);
      sprite.setFrame(n * w, row * h, w, h);
      sprite.x = (i - (string.length - 1) / 2) * w;
      sprite.baseY = baseHeight;
      sprite.dy = -i;
    }
  };

  Sprite_Damage.prototype.updateChild = function (sprite) {
    if (!sprite.isGolem) {
      sprite.dy += 0.5;
      sprite.ry += sprite.dy;
      if (sprite.ry >= 0) {
        sprite.ry = 0;
        sprite.dy *= -0.6;
      }
      var shift = sprite.baseY ? sprite.baseY : 0;
      sprite.y = Math.round(sprite.ry + shift);
      sprite.setBlendColor(this._flashColor);
    }
  };

  // 技が吸収タイプであるほか、ドレイン剣がかかっていて通常攻撃属性の攻撃でも吸収
  Game_Action.prototype.isDrain = function () {
    return (
      this.checkDamageType([5, 6]) ||
      (this.subject().isStateAffected(60) &&
        this.item().damage.elementId < 0 &&
        this.isDamage())
    );
  };

  // クリティカルはダメージ2倍にとどめる
  Game_Action.prototype.applyCritical = function (damage) {
    return damage * 2;
  };
  // クリティカル時ダメージ表示を光らせるのではなく画面全体を光らせる
  Sprite_Damage.prototype.setupCriticalEffect = function () {
    $gameScreen.startFlash([255, 255, 255, 255], 10);
  };

  // ものまね対象スキルか、なければ戦うを返す
  Game_Action.prototype.traceSkill = function (item) {
    if (item) {
      if (item.isSkill()) this.setSkill(item._itemId);
      else this.setItem(item._itemId);
    } else this.setAttack();
  };

  // 自然を場所に応じた技にすり替え(0:平原、1:森林、2:砂漠、3:街中、4:山、5:海、6:洞窟、7:雪、8:無)
  var natureSkills = [
    [180, 181, 182],
    [197, 183, 180],
    [185, 186, 180],
    [182, 184, 191],
    [187, 188, 181],
    [189, 194, 182],
    [187, 195, 184],
    [190, 181, 191],
    [192, 191, 187],
  ];
  Game_Action.prototype.natureSkill = function (location) {
    var index = Math.floor(Math.random() / 0.4);
    this.setSkill(natureSkills[location][index]);
  };

  Game_Map.prototype.setup = function (mapId) {
    if (!$dataMap) {
      throw new Error("The map data is not available");
    }
    this._mapId = mapId;
    this._tilesetId = $dataMap.tilesetId;
    this._displayX = 0;
    this._displayY = 0;
    this.refereshVehicles();
    this.setupEvents();
    this.setupScroll();
    this.setupParallax();
    this.setupBattleback();
    this._needsRefresh = false;
    $gameScreen.setZoom(
      $gamePlayer.screenX(),
      $gamePlayer.screenY() - 24,
      getMapZoom($dataMap)
    );
  };

  getMapZoom = function (map) {
    var noteZoom = /<(?:Zoom):[ ](\d+)>/i;
    var notedata = map.note.split(/[\r\n]+/);

    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(noteZoom)) {
        return parseInt(RegExp.$1) / 10;
      }
    }
    return 1;
  };

  // 動的MP
  Game_BattlerBase.prototype.skillMpCost = function (skill) {
    // プレイ時間
    if (skill.dynamicMp == 1) return Math.floor($gameSystem.playtime() / 3600);
    else return Math.floor(skill.mpCost * this.mcr);
  };

  // 飛空艇の速さ倍
  Game_Vehicle.prototype.initMoveSpeed = function () {
    if (this.isBoat()) {
      this.setMoveSpeed(4);
    } else if (this.isShip()) {
      this.setMoveSpeed(5);
    } else if (this.isAirship()) {
      this.setMoveSpeed(7);
    }
  };

  // 飛空艇乗り込み時にマップを縮小
  Game_Player.prototype.getOnVehicle = function () {
    var direction = this.direction();
    var x1 = this.x;
    var y1 = this.y;
    var x2 = $gameMap.roundXWithDirection(x1, direction);
    var y2 = $gameMap.roundYWithDirection(y1, direction);
    if ($gameMap.airship().pos(x1, y1)) {
      this._vehicleType = "airship";
    } else if ($gameMap.ship().pos(x2, y2)) {
      this._vehicleType = "ship";
    } else if ($gameMap.boat().pos(x2, y2)) {
      this._vehicleType = "boat";
    }
    if (this.isInVehicle()) {
      this._vehicleGettingOn = true;
      drowsepost.camera.zoom(0.4, 50, $gamePlayer);
      if (!this.isInAirship()) {
        this.forceMoveForward();
      }
      this.gatherFollowers();
    }
    return this._vehicleGettingOn;
  };
  Game_Player.prototype.getOffVehicle = function () {
    if (this.vehicle().isLandOk(this.x, this.y, this.direction())) {
      if (this.isInAirship()) {
        this.setDirection(2);
      }
      this._followers.synchronize(this.x, this.y, this.direction());
      this.vehicle().getOff();
      if (!this.isInAirship()) {
        this.forceMoveForward();
        this.setTransparent(false);
      }
      drowsepost.camera.zoom(0.6, 50, $gamePlayer);
      this._vehicleGettingOff = true;
      this.setMoveSpeed(4);
      this.setThrough(false);
      this.makeEncounterCount();
      this.gatherFollowers();
    }
    return this._vehicleGettingOff;
  };

  // Helpは基本一行
  Window_Help.prototype.initialize = function (numLines) {
    var width = Graphics.boxWidth;
    var height = this.fittingHeight(numLines || 1);
    Window_Base.prototype.initialize.call(this, 0, 0, width, height);
    this._text = "";
  };

  // 指定アニメーションは味方対象でも反転しない
  Game_Actor.prototype.startAnimation = function (animationId, mirror, delay) {
    var noMirrorAnim = [150, 197, 201, 205, 207, 307];
    if (!noMirrorAnim.contains(animationId)) mirror = !mirror;
    Game_Battler.prototype.startAnimation.call(
      this,
      animationId,
      mirror,
      delay
    );
  };

  // Reversibleな敵向けスキルはメニュー画面で使えるようにする(ミニマム・トード用)
  Scene_ItemBase.prototype.determineItem = function () {
    var action = new Game_Action(this.user());
    var item = this.item();
    action.setItemObject(item);
    if (action.isForFriend() || item.isReversible) {
      this.showSubWindow(this._actorWindow);
      this._actorWindow.selectForItem(this.item());
    } else {
      this.useItem();
      this.activateItemWindow();
    }
  };
  Scene_ItemBase.prototype.itemTargetActors = function () {
    var action = new Game_Action(this.user());
    action.setItemObject(this.item());
    if (!(action.isForFriend() || this.item().isReversible)) {
      return [];
    } else if (action.isForAll()) {
      return $gameParty.members();
    } else if (this.user().isNextActionForceForAll()) {
      return $gameParty.members();
    } else {
      return [$gameParty.members()[this._actorWindow.index()]];
    }
  };

  // 非戦闘時のアクション処理をapplyとは別に用意
  Scene_ItemBase.prototype.applyItem = function () {
    var action = new Game_Action(this.user());
    action.setItemObject(this.item());
    this.itemTargetActors().forEach(function (target) {
      for (var i = 0; i < action.numRepeats(); i++) {
        action.applyNotBattle(target);
      }
    }, this);
    action.applyGlobal();
  };
  Game_Action.prototype.applyNotBattle = function (target) {
    var result = target.result();
    this.subject().clearResult();
    result.clear();
    if (this.item().damage.type > 0) {
      result.critical = Math.random() < this.itemCri(target);
      var value = this.makeDamageValue(target, result.critical);
      this.executeDamage(target, value);
    }
    this.item().effects.forEach(function (effect) {
      this.applyItemEffect(target, effect);
    }, this);
    this.applyItemUserEffect(target);
  };

  Window_ActorCommand.prototype.commandName = function (index) {
    if (this._list[index].name === "構える") {
      if (this._actor && this._actor.isStateAffected(123)) return "烈狼の構え";
      else return "堅丑の構え";
    } else return this._list[index].name;
  };

  // 素手判定
  Game_Actor.prototype.isBareHands = function () {
    return this._equips[0] && this._equips[1] && this._equips[0]._itemId == 1 && this._equips[1]._itemId == 1;
  }

  // 魔法剣アニメーション切り替え
  Game_Actor.prototype.attackAnimationId1 = function () {
    if (this.hasNoWeapons()) {
      return this.bareHandsAnimationId();
      // 火剣
    } else if (
      this.isStateAffected(51) ||
      this.isStateAffected(57) ||
      this.isStateAffected(63)
    ) {
      return 8;
      // 氷剣
    } else if (
      this.isStateAffected(52) ||
      this.isStateAffected(58) ||
      this.isStateAffected(64)
    ) {
      return 9;
      // 雷剣
    } else if (
      this.isStateAffected(53) ||
      this.isStateAffected(59) ||
      this.isStateAffected(65)
    ) {
      return 10;
      // 毒剣
    } else if (this.isStateAffected(54) || this.isStateAffected(62)) {
      return 168;
      // 黙剣
    } else if (this.isStateAffected(55)) {
      return 169;
      // 眠剣
    } else if (this.isStateAffected(56)) {
      return 170;
      // ドレイン剣
    } else if (this.isStateAffected(60)) {
      return 171;
      // 石剣
    } else if (this.isStateAffected(61)) {
      return 172;
      // 聖剣
    } else if (this.isStateAffected(66)) {
      return 7;
      // フレア剣
    } else if (this.isStateAffected(67)) {
      return 173;
      // アスピル剣
    } else if (this.isStateAffected(68)) {
      return 174;
      // 水剣
    } else if (this.isStateAffected(69)) {
      return 175;
      // 土剣
    } else if (this.isStateAffected(70)) {
      return 176;
      // 風剣
    } else if (this.isStateAffected(71)) {
      return 177;
      // 闇剣
    } else if (this.isStateAffected(72)) {
      return 178;
      // 撃剣
    } else if (this.isStateAffected(74)) {
      return 191;
    } else {
      var weapons = this.weapons();
      return weapons[0] ? weapons[0].animationId : 0;
    }
  };
  Game_Actor.prototype.attackAnimationId2 = function () {
    if (
      this.isStateAffected(51) ||
      this.isStateAffected(57) ||
      this.isStateAffected(63)
    ) {
      return 8;
      // 氷剣
    } else if (
      this.isStateAffected(52) ||
      this.isStateAffected(58) ||
      this.isStateAffected(64)
    ) {
      return 9;
      // 雷剣
    } else if (
      this.isStateAffected(53) ||
      this.isStateAffected(59) ||
      this.isStateAffected(65)
    ) {
      return 10;
      // 毒剣
    } else if (this.isStateAffected(54) || this.isStateAffected(62)) {
      return 168;
      // 黙剣
    } else if (this.isStateAffected(55)) {
      return 169;
      // 眠剣
    } else if (this.isStateAffected(56)) {
      return 170;
      // ドレイン剣
    } else if (this.isStateAffected(60)) {
      return 171;
      // 石剣
    } else if (this.isStateAffected(61)) {
      return 172;
      // 聖剣
    } else if (this.isStateAffected(66)) {
      return 7;
      // フレア剣
    } else if (this.isStateAffected(67)) {
      return 173;
      // アスピル剣
    } else if (this.isStateAffected(68)) {
      return 174;
      // 水剣
    } else if (this.isStateAffected(69)) {
      return 175;
      // 土剣
    } else if (this.isStateAffected(70)) {
      return 176;
      // 風剣
    } else if (this.isStateAffected(71)) {
      return 177;
      // 闇剣
    } else if (this.isStateAffected(72)) {
      return 178;
    } else {
      var weapons = this.weapons();
      return weapons[1] ? weapons[1].animationId : 0;
    }
  };

  // スキル画面レイアウト変更
  Window_SkillType.prototype.windowWidth = function () {
    return 165 + this.standardPadding() * 2;
  };
  Window_SkillType.prototype.windowHeight = function () {
    return Graphics.boxHeight - this.fittingHeight(1);
  };
  Scene_Skill.prototype.createStatusWindow = function () {
    var wx = this._skillTypeWindow.width;
    var wy = this._helpWindow.height;
    var ww = Graphics.boxWidth - wx;
    var wh = this._skillTypeWindow.fittingHeight(4);
    this._statusWindow = new Window_SkillStatus(wx, wy, ww, wh);
    this._statusWindow.reserveFaceImages();
    this.addWindow(this._statusWindow);
  };
  Scene_Skill.prototype.createItemWindow = function () {
    var wx = this._statusWindow.x;
    var wy = this._statusWindow.y + this._statusWindow.height;
    var ww = Graphics.boxWidth - wx;
    var wh = Graphics.boxHeight - wy;
    this._itemWindow = new Window_SkillList(wx, wy, ww, wh);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
    this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
    this._skillTypeWindow.setSkillWindow(this._itemWindow);
    this.addWindow(this._itemWindow);
  };
  Window_SkillList.prototype.includesItem = function (item) {
    if (!item) return false;
    if (this._stypeId === 12) return $gameParty.knowMix(item);
    return (
      (item._type === this._stypeId ||
        (this._stypeId === 35 && item._throwable)) &&
      item._level < this._skillLevel
    );
  };

  // jsonロード時に勝手に追加
  MiMi_DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
  DataManager.isDatabaseLoaded = function () {
    if (MiMi_DaMa_isDatabaseLoaded.call(this)) {
      // $dataSystem.terms.paramsの11番目(i = 10)の値に魔法回避率の名前を設定
      $dataSystem.terms.params.push("魔法回避率");
      return true;
    }
    return false;
  };

  // paramからxparamにアクセス
  Game_BattlerBase.prototype.param = function (paramId) {
    if (paramId > 7) return this.xparam(paramId - 8) * 100;
    var value = this.paramBase(paramId) + this.paramPlus(paramId);
    value *= this.paramRate(paramId) * this.paramBuffRate(paramId);
    // 攻撃/防御/魔法防御は装備の値のみで計算する
    if ([2, 3, 5].contains(paramId)) {
      if (value > 1) value--;
      else return 0;
    }
    var maxValue = this.paramMax(paramId);
    var minValue = this.paramMin(paramId);
    return Math.round(value.clamp(minValue, maxValue));
  };

  Game_Battler.prototype.customParamPlus = function (paramId) {
    return this._battleParam[paramId];
  };

  Game_Battler.prototype.resetBattleParam = function () {
    return (this._battleParam = [0, 0, 0, 0, 0, 0, 0, 0]);
  };

  // 全滅時は全滅シーンには行かず最新のチェックポイントへ飛ばすだけ
  BattleManager.updateBattleEnd = function () {
    if (this.isBattleTest()) {
      AudioManager.stopBgm();
      SceneManager.exit();
    } else if (!this._escaped && $gameParty.isAllDead()) {
      if (this._canLose) {
        $gameParty.reviveBattleMembers();
        SceneManager.pop();
      } else {
        if ($gamePlayer._resumeMapId != null)
          $gamePlayer.reserveTransfer(
            $dataSystem._resumeMapId,
            $dataSystem._resumeX,
            $dataSystem._resumeY
          );
        else
          $gamePlayer.reserveTransfer(
            $dataSystem.startMapId,
            $dataSystem.startX,
            $dataSystem.startY
          );
        $gameParty.reviveBattleMembers();
        $gameSwitches.setValue(1, true);
        SceneManager.pop();
      }
    } else {
      SceneManager.pop();
    }
    this._phase = null;
  };

  // 全滅時復活用チェックポイントをメンバーに登録
  MyMi_GaCh_initMembers = Game_Character.prototype.initMembers;
  Game_Character.prototype.initMembers = function () {
    MyMi_GaCh_initMembers.call(this);
    this._resumeMapId = null;
    this._resumeX = null;
    this._resumeY = null;
  };

  // svActorの画像はあらかじめ読み込む
  Scene_Boot.loadSystemImages = function () {
    ImageManager.reserveSvActor("erio_blackmagi");
    ImageManager.reserveSvActor("erio_bluemagi");
    ImageManager.reserveSvActor("erio_dancer");
    ImageManager.reserveSvActor("erio_darkknight");
    ImageManager.reserveSvActor("erio_dragonknight");
    ImageManager.reserveSvActor("erio_gradiator");
    ImageManager.reserveSvActor("erio_hunter");
    ImageManager.reserveSvActor("erio_knight");
    ImageManager.reserveSvActor("erio_machinary");
    ImageManager.reserveSvActor("erio_monk");
    ImageManager.reserveSvActor("erio_monomane");
    ImageManager.reserveSvActor("erio_gradiator");
    ImageManager.reserveSvActor("erio_ninja");
    ImageManager.reserveSvActor("erio_oracle");
    ImageManager.reserveSvActor("erio_pharmacist");
    ImageManager.reserveSvActor("erio_pirates");
    ImageManager.reserveSvActor("erio_samurai");
    ImageManager.reserveSvActor("erio_summoner");
    ImageManager.reserveSvActor("erio_suppin");
    ImageManager.reserveSvActor("erio_swordmagi");
    ImageManager.reserveSvActor("erio_thief");
    ImageManager.reserveSvActor("erio_timemagi");
    ImageManager.reserveSvActor("erio_whitemagi");

    ImageManager.reserveSvActor("diana_blackmagi");
    ImageManager.reserveSvActor("diana_bluemagi");
    ImageManager.reserveSvActor("diana_dancer");
    ImageManager.reserveSvActor("diana_darkknight");
    ImageManager.reserveSvActor("diana_dragonknight");
    ImageManager.reserveSvActor("diana_gradiator");
    ImageManager.reserveSvActor("diana_hunter");
    ImageManager.reserveSvActor("diana_knight");
    ImageManager.reserveSvActor("diana_machinary");
    ImageManager.reserveSvActor("diana_monk");
    ImageManager.reserveSvActor("diana_monomane");
    ImageManager.reserveSvActor("diana_gradiator");
    ImageManager.reserveSvActor("diana_ninja");
    ImageManager.reserveSvActor("diana_oracle");
    ImageManager.reserveSvActor("diana_pharmacist");
    ImageManager.reserveSvActor("diana_pirates");
    ImageManager.reserveSvActor("diana_samurai");
    ImageManager.reserveSvActor("diana_summoner");
    ImageManager.reserveSvActor("diana_suppin");
    ImageManager.reserveSvActor("diana_swordmagi");
    ImageManager.reserveSvActor("diana_thief");
    ImageManager.reserveSvActor("diana_timemagi");
    ImageManager.reserveSvActor("diana_whitemagi");

    ImageManager.reserveSvActor("askal_blackmagi");
    ImageManager.reserveSvActor("askal_bluemagi");
    ImageManager.reserveSvActor("askal_dancer");
    ImageManager.reserveSvActor("askal_darkknight");
    ImageManager.reserveSvActor("askal_dragonknight");
    ImageManager.reserveSvActor("askal_gradiator");
    ImageManager.reserveSvActor("askal_hunter");
    ImageManager.reserveSvActor("askal_knight");
    ImageManager.reserveSvActor("askal_machinary");
    ImageManager.reserveSvActor("askal_monk");
    ImageManager.reserveSvActor("askal_monomane");
    ImageManager.reserveSvActor("askal_gradiator");
    ImageManager.reserveSvActor("askal_ninja");
    ImageManager.reserveSvActor("askal_oracle");
    ImageManager.reserveSvActor("askal_pharmacist");
    ImageManager.reserveSvActor("askal_pirates");
    ImageManager.reserveSvActor("askal_samurai");
    ImageManager.reserveSvActor("askal_summoner");
    ImageManager.reserveSvActor("askal_suppin");
    ImageManager.reserveSvActor("askal_swordmagi");
    ImageManager.reserveSvActor("askal_thief");
    ImageManager.reserveSvActor("askal_timemagi");
    ImageManager.reserveSvActor("askal_whitemagi");

    ImageManager.reserveSvActor("miris_blackmagi");
    ImageManager.reserveSvActor("miris_bluemagi");
    ImageManager.reserveSvActor("miris_dancer");
    ImageManager.reserveSvActor("miris_darkknight");
    ImageManager.reserveSvActor("miris_dragonknight");
    ImageManager.reserveSvActor("miris_gradiator");
    ImageManager.reserveSvActor("miris_hunter");
    ImageManager.reserveSvActor("miris_knight");
    ImageManager.reserveSvActor("miris_machinary");
    ImageManager.reserveSvActor("miris_monk");
    ImageManager.reserveSvActor("miris_monomane");
    ImageManager.reserveSvActor("miris_gradiator");
    ImageManager.reserveSvActor("miris_ninja");
    ImageManager.reserveSvActor("miris_oracle");
    ImageManager.reserveSvActor("miris_pharmacist");
    ImageManager.reserveSvActor("miris_pirates");
    ImageManager.reserveSvActor("miris_samurai");
    ImageManager.reserveSvActor("miris_summoner");
    ImageManager.reserveSvActor("miris_suppin");
    ImageManager.reserveSvActor("miris_swordmagi");
    ImageManager.reserveSvActor("miris_thief");
    ImageManager.reserveSvActor("miris_timemagi");
    ImageManager.reserveSvActor("miris_whitemagi");
  };

  // SEミュートフラグが立っている間はSEを演奏しない
  MyMi_AudioManager_playSe = AudioManager.playSe;
  AudioManager.playSe = function (se) {
    if (!$gameSwitches.value(7)) {
      MyMi_AudioManager_playSe.call(this, se);
    }
  };

  // 決定効果音禁止フラグが立っている間は決定SEを演奏しない
  Window_Selectable.prototype.playOkSound = function() {
    if (!$gameSwitches.value(13)) {
      SoundManager.playOk();
    }
  };

  // イベントによるアイテム取得時、取得したアイテム名を記憶しておく
  let gainedItemName = null;
  let gainedGold = null;
  MyMiPl_GaIn_command125 = Game_Interpreter.prototype.command125;
  Game_Interpreter.prototype.command125 = function() {
    gainedGold = this._params[2];
    return MyMiPl_GaIn_command125.call(this);
  };
  MyMiPl_GaIn_command126 = Game_Interpreter.prototype.command126;
  Game_Interpreter.prototype.command126 = function () {
    gainedItemName = $dataItems[this._params[0]].name;
    return MyMiPl_GaIn_command126.call(this);
  };
  MyMiPl_GaIn_command127 = Game_Interpreter.prototype.command127;
  Game_Interpreter.prototype.command127 = function () {
    gainedItemName = $dataWeapons[this._params[0]].name;
    return MyMiPl_GaIn_command127.call(this);
  };
  MyMiPl_GaIn_command128 = Game_Interpreter.prototype.command128;
  Game_Interpreter.prototype.command128 = function () {
    gainedItemName = $dataArmors[this._params[0]].name;
    return MyMiPl_GaIn_command128.call(this);
  };
  MyMiPl_WiBa_convertEscapeCharacters =
    Window_Base.prototype.convertEscapeCharacters;
  Window_Base.prototype.convertEscapeCharacters = function (text) {
    text = text.replace(/\\/g, "\x1b");
    text = text.replace(/\x1b\x1b/g, "\\");
    text = text.replace(
      /\x1bV\[(\d+)\]/gi,
      function () {
        return $gameVariables.value(parseInt(arguments[1]));
      }.bind(this)
    );
    text = MyMiPl_WiBa_convertEscapeCharacters.call(this, text);
    text = text.replace(/\x1bItemName/g, gainedItemName ? gainedItemName : "");
    text = text.replace(/\x1bAddedGold/g, gainedGold ? gainedGold : "");
    text = text.replace(/\x1bSkillName\[(\d+)\]/g, (_,n)=>$dataSkills[n].name);
    return text;
  };

  // 顔を描画する場面では基本的にSVキャラを表示する
  Window_Base.prototype.drawActorFace = function(actor, x, y, width, height) {
    // TODO: ここのカエルの表示、正しいか確認する
		if (actor && actor.isStateAffected(12)) this.drawSvCharacter('frog', x, y, width, height);
    else this.drawSvCharacter(actor.battlerName(), x, y, width, height);
  };
  Window_Base.prototype.drawSvCharacter = function(faceName, x, y, width, height) {
    width = width || Window_Base._faceWidth;
    height = height || Window_Base._faceWidth;
    var bitmap = ImageManager.loadSvActor(faceName);
    var sw = 64;
    var sh = 64;
    var dx = Math.floor(x + Math.max(width - sw, 0) / 2);
    var dy = Math.floor(y + Math.max(height - sh, 0) / 2);
    this.contents.blt(bitmap, 0, 0, sw, sh, dx, dy);
};

// メニューでアクター選択時は場所記憶しない
Scene_Menu.prototype.commandPersonal = function() {
  this._statusWindow.setFormationMode(false);
  this._statusWindow.select(0);
  this._statusWindow.activate();
  this._statusWindow.setHandler('ok',     this.onPersonalOk.bind(this));
  this._statusWindow.setHandler('cancel', this.onPersonalCancel.bind(this));
};
Scene_Menu.prototype.commandFormation = function() {
    this._statusWindow.setFormationMode(true);
    this._statusWindow.select(0);
    this._statusWindow.activate();
    this._statusWindow.setHandler('ok',     this.onFormationOk.bind(this));
    this._statusWindow.setHandler('cancel', this.onFormationCancel.bind(this));
};
})();
