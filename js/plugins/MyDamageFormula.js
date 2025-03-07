/*:
 * @plugindesc ダメージ計算式をFF5式(FF6要素を含む)に変更
 * @author paisuygoda
 * @help 属性有効度は0=吸収、1=無効、それ以上=実値である
 */

(function() {

    Game_Action.prototype.makeDamageValue = function(target, critical) {
		// 石化時は一切の計算をせずに0で返す
		if (target.isStateAffected(24)) return 0;
		
		var item = this.item();
		var baseValue = this.evalDamageFormula(target);
		var value = baseValue * this.calcElementRate(target);
		// 吸収技のとき吸収保証ステートによってダメージ量反転
		if (this.isDrain()) {
			if (value > 0 && target.isStateAffected(115)) value *= -1;
			if (value < 0 && this.subject().isStateAffected(115)) value *= -1;
		}
		// 回復時はプロテス/シェルの影響を受けない
		if (baseValue < 0) {
			value *= target.rec;
		} else {
			if (this.isPhysical()) {
				value *= target.pdr;
			}
			if (this.isMagical()) {
				value *= target.mdr;
			}
		}
		if (critical) {
			value = this.applyCritical(value);
		}
		// サバイブ反映
		var subject = this.subject();
		if (subject.isStateAffected(77) && value > 0) value *= ((subject.mhp - subject.hp) / subject.mhp * 2) + 1
		// 種族特攻の反映
		if (subject.isActor() && this.applyDualWield()) {
			var raceEffect = subject.getPrimaryWeapon().effectsRace;
			if (raceEffect && value > 0 && target.isStateAffected(raceEffect['race'])) value *= raceEffect['rate'];
		}
		
		value = this.applyVariance(value, item.damage.variance);
		value = this.applyGuard(value, target);
		value = Math.round(value);
		return value;
	};

	
	// 属性耐性は累計でなく一番有利な耐性のみを取る
	// 吸収>無効>半減>弱点
	Game_BattlerBase.prototype.elementRate = function(elementId, subject=null) {
		// ついでに凍結解除
		if (this.isStateAffected(30) && elementId === 2) this.removeState(30);
		// 生存者に蘇生技が当たっていたら回復量を無効化する
		if (this.isAlive() && elementId === 13) return 0;
		// フォースフィルドによる無効処理
		if (BattleManager._forceField && BattleManager._forceField.contains(elementId)) return 0;
		var fortifiedRate = (subject && subject.isStateAffected(convertElementIdToStateId(elementId))) ? 2 : 1;
		return fortifiedRate * this.traitsWithId(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId).reduce(function(r, trait) {
			// ウィークメーカーによる弱点(2.01)は絶対
			if (trait.value > 2 || r > 2) return 2.01; 
			else if (trait.value === 0) return -1;
			else if (trait.value === 0.01) return Math.min(r, 0);
			else return r != 1 ? Math.min(r, trait.value) : trait.value;
		}, 1);
	};

	var convertElementIdToStateId = function(elementId) {
		switch(elementId) {
			case 2:
				return 102;
			case 3:
				return 103;
			case 4:
				return 104;
			case 5:
				return 105;
			case 6:
				return 106;
			case 7:
				return 107;
			case 8:
				return 108;
			case 9:
				return 109;
			case 10:
				return 110;
			case 11:
				return 111;
		}
	}

	Game_Action.prototype.calcElementRate = function(target) {
		if (this.item().damage.elementId < 0) {
			return this.elementsMaxRate(target, this.subject().attackElements());
		} else {
			return target.elementRate(this.item().damage.elementId, this.subject());
		}
	};

	// 通常攻撃属性の攻撃は魔法剣も気にする(属性騎士剣も気にする)
	Game_Action.prototype.elementsMaxRate = function(target, elements) {
		if (elements.length > 1) {
			// 物理割合は別途処理し、そこに属性割合をかける
			var physicalRate = elements.contains(1) ? target.elementRate(1, this.subject()) : 1;
			// 属性割合だけで計算
			elements = elements.filter(n => n !== 1);
			var elemRate;
			elemRate = elements.length === 0 ? 1 : Math.max.apply(null, elements.map(function(elementId) {
				return target.elementRate(elementId, this.subject());
			}, this));
			console.log(elemRate);
			if (elemRate < 2) return physicalRate * elemRate;
			var swordRate = this.subject().getSwordMagiRate(elemRate);
			// ダメ計途中であんまよくないが即死付与してみる
			if (swordRate == 4) target.addState(38);
			return swordRate * physicalRate;
		} else if (elements.length == 1) {
			return target.elementRate(elements[0], this.subject());
		} else {
			return 1;
		}
	};

	// 魔法剣弱点攻撃時の攻撃倍率を取得する(媒体となる剣に属性剣はない、かつ魔法剣ステートは排他である前提)
	Game_BattlerBase.prototype.getSwordMagiRate = function(origRate) {
		var swordMagiState = [51, 52, 53, 54, 57, 58, 59, 62, 63, 64, 65, 66, 69, 70, 71, 72];
		for (var i = 0; i < swordMagiState.length; i++) {
			if (this.isStateAffected(swordMagiState[i])) return $dataStates[swordMagiState[i]].swordElemRate;
		}
		return origRate;
	};
	
	// たたかうのダメージをX倍するスキル用に、計算式から戦うダメージを引けるようにする
	Game_Action.prototype.attackDamage = function(target) {
		try {
			var item =$dataSkills[this.subject().attackSkillId()];
			var a = this.subject();
			var b = target;
			var v = $gameVariables._data;
			var sign = ([3, 4].contains(item.damage.type) ? -1 : 1);
			var value = Math.max(eval(item.damage.formula), 0) * sign;
			if (isNaN(value)) value = 0;
			return value;
		} catch (e) {
			return 0;
		}
	};

	// ジャンプ攻撃の倍率（槍装備なら2倍）
	Game_Action.prototype.jumpRate = function() {
		var weapon = this.subject().weapons()[0];
		return (weapon && weapon.etypeId === 12) ? 1 : 0.5;
	};

	//　成功率が0の時、必中に読み替える
	// レベル系などの条件付きスキルの命中処理
	Game_Action.prototype.itemHit = function(target) {
		if (this.item().successRate == 0) {
			var level = this.item().levelSkill;
			if (level == 0) return 1;
			// レベル系スキル
			else if (level < 6) {
				if (target.blv % level == 0) return 1;
			// レベル？ホーリー
			} else if (level == 6) {
				var gil = $gameParty.gold() % 10;
				if (gil == 0) return 0;
				else if (target.blv % gil == 0) return 1;
			// リフレク？？？？
			}  else if (level == 7) {
				if (target.isStateAffected(21)) return 1;
			} else return 1;
		}
		if (this.isPhysical()) {
			// 必中ステートの時物理攻撃は必中に読み替え
			if (this.subject().isStateAffected(76)) return 1;
			else return this.item().successRate * 0.01 * this.subject().hit;
		} else {
			return this.item().successRate * 0.01;
		}
	};

	Game_Action.prototype.itemEva = function(target) {
		var eva = 0;
		if (this.isPhysical()) {
			// target分身時、分身を一枚減らして回避率100%にする
			if (target.isStateAffected(27)) {
				if (--target._blinks === 0) target.removeState(27);
				return 1;
			} else if (target.isStateAffected(31)) {
				return 1;
			} 
			// 命中率が0の技は必中に読み替えるので回避率0
			else if (this.item().successRate == 0) return 0;
			// 必中ステートの時物理攻撃は必中に読み替え
			else if (this.subject().isStateAffected(76)) return 0;
			else eva = target.eva;
		} else {
			if (target.isStateAffected(31)) target.removeState(31);

			// 命中率が0の技は必中に読み替えるので回避率0
			if (this.item().successRate == 0) return 0;
			else eva = target.mev;
		}
		// 小人の時回避率2倍(盾とかは関係ない)
		if (target.isStateAffected(13)) eva *= 2;
		// 回避率半減スキルの反映
		if (this.item()._halfEva) eva /= 2;
		
		return eva;
	};

})();