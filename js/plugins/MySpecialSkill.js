/*:
 * @plugindesc 盗むやライブラなどの特殊スキルシステム
 * @author paisuygoda
 */

(function() {

	Game_Action.prototype.applySpecialSkills = function(target) {
		// ダメージ処理時にぬすむ判定も行う
		this.applySteal(target);
		// ライブラ処理も行う
		this.applyLibrary(target);
		// ラーニング処理
		this.applyLearning(target);
		// レベル操作
		this.applyManipulateLevel(target);
		// 自己犠牲スキル
		this.applySacrifice(target);
		// フォースフィルド
		this.applyForceField();
		// 波紋
		this.applyRipple(target);
		// 魔法剣によるステート付与
		this.applySwordState(target);
		// 対象の魔封剣状態による魔法剣付与
		this.applyRunic(target);
		// ゴーレム召喚処理
		this.applyGolem(target);
		// ラグナロック召喚処理
		this.applyRagnalok(target);
		// パラメータ操作処理
		this.applyManipParam(target);
		// 祟り目処理
		this.applyCurse(target);
		// ウィークメーカー処理
		this.applyWeakMaker(target);
	}

	Game_Action.prototype.applyNoTargetSpecialSkills = function() {
		// フォースフィルド
		this.applyForceField();
		// 使用者へのステート操作
		this.applySelfState();
		// 祈り失敗
		this.applyPrayFailure();
		// 予言処理
		this.applyProphecy();
		// 必殺カウント設定
		this.applyUltCount();
	}

	// 盗み処理
	Game_Action.prototype.applySteal = function(target) {
		if(this.item().isStealSkill) {
			if(!(target.itemAvailable(1) || target.itemAvailable(2))){
				BattleManager._logWindow.addItemNameText("何も持っていない！");
			} else {
				// (盗む基礎値)% で盗みに成功し、(レア盗み率) + (盗む基礎値-100)% でレアアイテムを取る
				// 盗む判定基礎値は(40 + 5 * (シーフジョブレベル))となる
				var stealBaseValue = (40 + 5 * this.subject()._jobLevel[3]) * (this.subject().isStateAffected(46) ? 2 : 1) / 100;
				// 盗み成功判定
				if(Math.random() < stealBaseValue) {
					// レア盗み判定
					if( target.itemAvailable(2) && Math.random() < 1 / target.enemy().dropItems[2].denominator + Math.max(0, stealBaseValue - 1)){
						target.haveItem[2] = false;
						var gainedItem = target.itemObject(target.enemy().dropItems[2].kind, target.enemy().dropItems[2].dataId);
						$gameParty.gainItem(gainedItem, 1);
						BattleManager._logWindow.addItemNameText(gainedItem.name + " を盗んだ");
					// 通常枠
					} else if (target.itemAvailable(1)) {
						target.haveItem[1] = false;
						var gainedItem = target.itemObject(target.enemy().dropItems[1].kind, target.enemy().dropItems[1].dataId);
						$gameParty.gainItem(gainedItem, 1);
						BattleManager._logWindow.addItemNameText(gainedItem.name + " を盗んだ");
					} else {
						BattleManager._logWindow.addItemNameText("盗みそこなった");
					}
				} else {
					BattleManager._logWindow.addItemNameText("盗みそこなった");
				}
			}
		}
	};

	// ライブラ処理
	Game_Action.prototype.applyLibrary = function(target) {
		if(this.item().isLibrary) {
			BattleManager._logWindow.addItemNameText("レベル" + target.blv + "  ＨＰ " + target.hp + "／" + target.mhp + "  ＭＰ " + target.mp + "／" + target.mmp);
			BattleManager._waitAnim = 90;

			var weakness = "";
			// var noEffect = "";
			// var drain = "";
			for (var elementId = 2; elementId < 11; elementId++) {
				var rate = target.traitsWithId(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId).reduce(function(r, trait) {
					if (trait.value > 2 || r > 2) return 2.01; 
					else if (trait.value === 0) return -1;
					else if (trait.value === 0.01) return Math.min(r, 0);
					else return r != 1 ? Math.min(r, trait.value) : trait.value;
				}, 1);
				if (rate >= 2) weakness += $dataSystem.elements[elementId] + " ";
				// else if (rate == 0) noEffect += $dataSystem.elements[elementId] + " ";
				// else if (rate <= -1) drain += $dataSystem.elements[elementId] + " ";
			}
			if (weakness != "") {
				BattleManager._logWindow.addItemNameText(weakness + "の力に弱い");
				BattleManager._waitAnim += 30;
			}
		}
	}

	// 敵がそのスロットにアイテムを持っているか
	Game_Enemy.prototype.itemAvailable = function(i) {
		return this.enemy().dropItems[i].kind != 0 && this.haveItem[i];
	};

	// ドロップアイテムは1種に絞る
	Game_Enemy.prototype.makeDropItems = function() {
		var di = this.enemy().dropItems[0];
		return (di.kind > 0 && Math.random() * di.denominator < this.dropItemRate()) ? [this.itemObject(di.kind, di.dataId)] : [];
	};

	// ラーニング処理
	Game_Action.prototype.applyLearning = function(target) {
		var item = this.item();
		if(item.stypeId == 5 
				&& (target.isStateAffected(48) || $gameParty.allMembers().some(actor => actor.isStateAffected(49)))
				&& !$gameParty.allMembers()[0].isLearnedSkill(item.id)
				&& !BattleManager._learnedSkill.contains(item.id)) {
			BattleManager._learnedSkill.push(item.id);
		}
	}

	BattleManager.displayLearned = function() {
		if (BattleManager._learnedSkill.length > 0) {
			$gameMessage.newPage();
			BattleManager._learnedSkill.forEach(function(skillId) {
				var item = $dataSkills[skillId];
				$gameParty.allMembers().forEach(function(actor) {
					actor.learnSkill(skillId);
				});
				$gameMessage.add('\\>「' + item.name + '」をラーニング！');
			});
		}
		BattleManager._learnedSkill = [];
	};

	// レベル操作
	Game_Action.prototype.applyManipulateLevel = function(target) {
		var item = this.item();
		if (item.manipulateLevel == 91) {
			target.blv = Math.floor(Math.max(1, target.blv / 2));
			BattleManager._logWindow.addItemNameText("レベル半減！");
			BattleManager._waitAnim += 30;
		} else if(item.manipulateLevel > 0) {
			target.blv += item.manipulateLevel;
		}
	}

	// 自己犠牲処理(sacrificeLevelが1:HPを0にする2:MPを0にする)
	Game_Action.prototype.applySacrifice = function(target) {
		if (this.item().sacrificeLevel == 1) {
			this.subject().addState(1);
		}
	}

	// フォースフィルド
	Game_Action.prototype.applyForceField = function() {
		if (this.isSkill() && this.item().id == 107) {
			var candidate = [];
			for (var i = 2; i < 11; i++) {
				if (!BattleManager._forceField.contains(i)) candidate.push(i);
			}
			if (candidate.length > 0) {
				var index = Math.randomInt(candidate.length);
				BattleManager._forceField.push(candidate[index]);
				BattleManager._logWindow.addItemNameText($dataSystem.elements[candidate[index]] + "の力が無効になった！");
			} else {
				BattleManager._logWindow.addItemNameText("効果が無かった");
			}

			BattleManager._waitAnim += 60;
		}
	}

	// 波紋
	Game_Action.prototype.applyRipple = function(target) {
		if (this.isSkill() && this.item().id == 109) {
			var subject = this.subject();
			var temp = subject._states;
			subject.clearStates();
			var passiveStates = [9, 11, 26, 31, 35];
			for (var i = 0; i < target._states.length; i++) {
				if (!passiveStates.contains(target._states[i])) subject.addState(target._states[i], true);
			}
			target.clearStates();
			for (var i = 0; i < temp.length; i++) {
				if (!passiveStates.contains(temp[i])) target.addState(temp[i], true);
			}
		}
	}

	// 魔法剣ステート付与
	Game_Action.prototype.applySwordState = function(target) {
		// 二刀流反映スキルの場合(=武器で攻撃する系のスキルの場合)
		if (this.applyDualWield()) {
			var swordState = this.subject().getSwordState();
			if (swordState) {
				target.addState(swordState);
			}
		}
	}

	// 魔法剣により付与するステートを取得する(魔法剣ステートは排他である前提)
	Game_BattlerBase.prototype.getSwordState = function() {
		var swordMagiState = [54, 55, 56, 61, 62];
		for (var i = 0; i < swordMagiState.length; i++) {
			if (this.isStateAffected(swordMagiState[i])) return $dataStates[swordMagiState[i]].swordState;
		}
		return null;
	};

	// 対象の魔封剣状態による魔法剣付与
	Game_Action.prototype.applyRunic = function(target) {
		if (this.isSkill() && this.item().id == 131) {
			var item = this.item();
			// 魔法剣に存在する魔法の場合
			if (item.name == 'ファイア') {
				target.addState(51);
			} else if (item.name == 'ブリザド') {
				target.addState(52);
			} else if (item.name == 'サンダー') {
				target.addState(53);
			} else if (item.name == 'ポイズン') {
				target.addState(54);
			} else if (item.name == 'サイレス') {
				target.addState(55);
			} else if (item.name == 'スリプル') {
				target.addState(56);
			} else if (item.name == 'ファイラ') {
				target.addState(57);
			} else if (item.name == 'ブリザラ') {
				target.addState(58);
			} else if (item.name == 'サンダラ') {
				target.addState(59);
			} else if (item.name == 'ドレイン') {
				target.addState(60);
			} else if (item.name == 'ブレイク') {
				target.addState(61);
			} else if (item.name == 'バイオ') {
				target.addState(62);
			} else if (item.name == 'ファイガ') {
				target.addState(63);
			} else if (item.name == 'ブリザガ') {
				target.addState(64);
			} else if (item.name == 'サンダガ') {
				target.addState(65);
			} else if (item.name == 'ホーリー') {
				target.addState(66);
			} else if (item.name == 'フレア') {
				target.addState(67);
			} else if (item.name == 'アスピル') {
				target.addState(68);
			} else if (item.name == 'アスピル') {
				target.addState(68);
			// ステータス付与/除去、回復魔法はMP吸収した後魔封剣を解除するだけ
			} else if (item.damage.type == 4) {
				target.removeState(73);
			// ダメージ系で属性付きダメージは各属性の～ガの効果を付与
			} else if (item.damage.elementId == 2) {
				target.addState(63);
			} else if (item.damage.elementId == 3) {
				target.addState(64);
			} else if (item.damage.elementId == 4) {
				target.addState(65);
			} else if (item.damage.elementId == 5) {
				target.addState(69);
			} else if (item.damage.elementId == 6) {
				target.addState(70);
			} else if (item.damage.elementId == 7) {
				target.addState(71);
			} else if (item.damage.elementId == 8) {
				target.addState(66);
			} else if (item.damage.elementId == 9) {
				target.addState(72);
			} else if (item.damage.elementId == 10) {
				target.addState(62);
			} else if (item.isUlt) {
				target.addState(67);
			} else target.addState(74);
		}
	}

	// ゴーレム召喚処理
	Game_Action.prototype.applyGolem = function(target) {
		if (this.isSkill() && this.item().id == 166) {
			$gameParty._golemHp = Math.max($gameParty._golemHp, target.blv * 50 + 1000);
		}
	}

	// ラグナロック召喚処理
	Game_Action.prototype.applyRagnalok = function(target) {
		if (this.isSkill() && this.item().id == 173) {
			var metamolItem = target.enemy().metamolItem;
			if (metamolItem['category'] === 0) {
				if (target.enemy().dropItems[2].kind === 0) {
					// メタモル設定もレア盗み設定もない場合消耗品からランダムに変化
					var gainedItem = target.itemObject(1, Math.randomInt(8) + 1);
				} else {
					var gainedItem = target.itemObject(target.enemy().dropItems[2].kind, target.enemy().dropItems[2].dataId);
				}
			} else {
				var gainedItem = target.itemObject(metamolItem['category'], metamolItem['id']);
			}
			$gameParty.gainItem(gainedItem, 1);
			BattleManager._logWindow.addItemNameText(gainedItem.name + " になるがいい！");
			BattleManager._waitAnim += 60;
		}
	}

	// 使用者へのステート操作
	Game_Action.prototype.applySelfState = function() {
		if (this.item().addState) this.subject().addState(this.item().addState);
		if (this.item().removeState) this.subject().removeState(this.item().removeState);
	}
	
	// パラメータ操作処理
	Game_Action.prototype.applyManipParam = function(target) {
		if (this.item().manipParam) {
			var manipParam = this.item().manipParam;
			target._battleParam[manipParam['index']] += manipParam['amount'];
		}
	}

	// 祈り失敗
	Game_Action.prototype.applyPrayFailure = function() {
		if (this.isSkill() && this.item().id == 235) {
			BattleManager._logWindow.addItemNameText("祈りは天に届かなかった…");
			BattleManager._waitAnim += 60;
		}
	}

	// 必殺カウント設定
	Game_Action.prototype.applyUltCount = function() {
		if (this.isSkill() && this.item().id == 265) this.subject()._ultCount = 7 - this.subject()._jobLevel[18];
	}
	
	// 予言処理
	Game_Action.prototype.applyProphecy = function() {
		if (this.isSkill() && this.item().id == 253) {
			// 予言済みの場合
			if (BattleManager._prophecy) {
				BattleManager._logWindow.addItemNameText("「" + $dataSkills[BattleManager._prophecy.skillId].name + "」を予言した");
				BattleManager._waitAnim += 60;
			} else {
				var subject = this.subject();
				var damageRate = (subject.hp % 10) + 1;
				var id = 254 + ((subject.mp + 7) % 10);
				BattleManager._prophecy = {
					count: 8 - subject._jobLevel[17],
					checkTurn: BattleManager._turnCount % 8,
					skillId: id,
					rate: damageRate
				}
				BattleManager._logWindow.addItemNameText("「" + $dataSkills[id].name + "」を予言した");
				BattleManager._waitAnim += 60;
			}
		}
	}
	
	// ウィークメーカー処理
	Game_Action.prototype.applyWeakMaker = function(target) {
		if (this.isItem() && this.item().id == 142) {
			var elements = [2, 3, 4, 5, 6, 7, 8, 9, 10];
			var possibleElements = elements.filter(function(elemId){return target.elementRate(elemId) < 2;});
			if (possibleElements.length > 0) {
				var weakenElem = possibleElements[Math.randomInt(possibleElements.length)];
				target.addState(122 + weakenElem);
				
				BattleManager._logWindow.addItemNameText($dataSystem.elements[weakenElem] + "の力に弱くなったぞ！");
			} else {
				BattleManager._logWindow.addItemNameText("既に全属性に弱い");
			}
			BattleManager._waitAnim += 60;
		}
	}

	// 祟り目処理
	Game_Action.prototype.applyCurse = function(target) {
		if (this.isSkill() && this.item().id == 252) {
			// 毒状態は累積量を5増やす
			if (target.isStateAffected(4)) target._poisonProgress += 5;
			// 暗闇or沈黙時両方にする
			if (target.isStateAffected(5) || target.isStateAffected(6)) {
				target.addState(5);
				target.addState(6);
			}
			// スロウ時様々な停止異常をかける
			if (target.isStateAffected(19)) {
				target.addState(10);
				target.addState(17);
			}
			// 混乱orバーサク時両方にする
			if (target.isStateAffected(7) || target.isStateAffected(8)) {
				target.addState(7);
				target.addState(8);
				target.addState(19);
			}
			// 様々な停止異常時他の停止異常とスロウを耐性無視でかける
			if (target.isStateAffected(10) || target.isStateAffected(28)) {
				target.addState(10);
				target.addState(17);
				target.addState(28);
				target.addNewState(19);
			}
			// スリップ時1000の固定ダメージ
			if (target.isStateAffected(23)) target.gainHp(-1000);
			// 老化時レべルを-10する
			if (target.isStateAffected(29)) {
				target.addNewState(19);
				target.blv -= 10;
			}
			// カエルor小人or凍結時即死させる
			if (target.isStateAffected(12) || target.isStateAffected(13) || target.isStateAffected(30)) target.addState(1);
		}
	}

	//-----------------------------------------------------------------------------------------------------------------------------

	Game_BattlerBase.prototype.paySkillCost = function(skill) {
		this._mp -= this.skillMpCost(skill);
		this._tp -= this.skillTpCost(skill);
		// 銭投げの場合所持金から引き落とし、足りない場合のために倍率を設定する
		if (skill.id === 210) {
			var baseCost = Math.min(this.blv, 50) * $gameTroop.aliveMembers().length * 50;
			var actualCost = Math.min($gameParty.gold(), baseCost);
			this._moneyRate = actualCost / baseCost;
			$gameParty.loseGold(actualCost);
		}
	};

	Game_BattlerBase.prototype.payPostSkillCost = function(skill) {

		// マダンテのMP枯渇処理
		if (skill.sacrificeLevel == 2) {
			this.setMp(0);
		}
		if (DataManager.isSkill(skill)){
			// HPの支払処理
			if ([267, 268].contains(skill.id)) {
				this.gainHp(Math.floor(-this.mhp / 8));
			}
			// MPクリティカル
			if ([271].contains(skill.id) && this.mp > 4) {
				this.setMp(this.mp - 5);
			}
		}
		
		// 即死予約の実行
		if (this.isStateAffected(133) && this.isStateAddable(38)) {
			this.addNewState(1);
			this.performCollapse();
		}
	};
})();