/*:
 * @plugindesc アイテムの挙動設定
 * @author paisuygoda
 * @help 
 */

(function() {

	// 宣告の読み込み
	var _loaded_Item_Setting = false;
	var MyItSe_DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
	if (!MyItSe_DaMa_isDatabaseLoaded.call(this)) return false;
	if (!_loaded_Item_Setting) {
		this.processNotetagsItemSetting($dataItems);
		this.processNotetagsItemSetting($dataWeapons);
		this.processNotetagsItemSetting($dataArmors);
		_loaded_Item_Setting = true;
	}
		return true;
	};

	DataManager.processNotetagsItemSetting = function(group) {
		var noteItemSetting = /<(?:ItemSetting):[ ](\d+)[ ](\d+)>/i;
		// リフレク貫通
		var notePassReflecCondition = /<(?:PassReflec)>/i;
		// アイテム使用可武器の紐づけ設定
		var noteReferItemCondition = /<(?:ReferItem):[ ](\d+)>/i;
		// 投擲武器の設定
		var noteThrowableCondition = /<(?:Throwable)>/i;
		// 調合消費アイテムの設定
		var noteMixCondition = /<(?:Mix):[ ](\d+)[ ](\d+)>/i;
		// 能力値操作
		var noteManipParam = /<(?:ManipParam:[ ](\d+)[ ](\d+))>/i;
		// レベル操作
		var noteManipLevelCondition = /<(?:ManipLevel):[ ](\d+)>/i;
		// 敵味方全体攻撃スキル
		var noteTargetAll = /<(?:TargetsAll)>/i;
		// 武器モーションセット
		var noteSetWeapon = /<(?:SetWeapon:)[ ](\d+)>/i;
		// たたかうすり替えスキルとその確率
		var noteAttackSubstitute = /<(?:AttackSubstitute:)[ ](\d+)[ ](\d+)>/i;
		// 特攻武器の設定
		var noteEffectsRace = /<(?:EffectsRace:)[ ](\d+)[ ](\d+)>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj._type = 0;
			obj._level = 0;
			obj.passReflec = false;
			obj._referItem = null;
			obj._referBack = null;
			obj._throwable = false;
			obj._mix = [];
			obj.manipParam = null;
			obj.manipulateLevel = 0;
			obj.targetsAll = false;
			obj.weapon = null;
			obj.attackSubstitute = null;
			obj.effectsRace = null;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteItemSetting)) {
					var type = parseInt(RegExp.$1);
					var level = parseInt(RegExp.$2);
					obj._type = type;
					obj._level = level;
				} else if (line.match(notePassReflecCondition)) {
					obj.passReflec = true;
				} else if (line.match(noteReferItemCondition)) {
					obj._referItem = parseInt(RegExp.$1);
					$dataItems[obj._referItem]._referBack = obj.id;
				} else if (line.match(noteThrowableCondition)) {
					obj._throwable = true;
				} else if (line.match(noteMixCondition)) {
					obj._mix.push(parseInt(RegExp.$1));
					obj._mix.push(parseInt(RegExp.$2));
				} else if (line.match(noteManipParam)) {
					var indexK = parseInt(RegExp.$1);
					var amountK = parseInt(RegExp.$2);
					obj.manipParam = { index: indexK, amount: amountK};
				} else if (line.match(noteManipLevelCondition)) {
					obj.manipulateLevel = parseInt(RegExp.$1);
				} else if (line.match(noteTargetAll)) {
					obj.targetsAll = true;
				} else if (line.match(noteSetWeapon)) {
					obj.weapon = parseInt(RegExp.$1);
				} else if (line.match(noteAttackSubstitute)) {
					var id = parseInt(RegExp.$1);
					var rate = parseInt(RegExp.$2);
					obj.attackSubstitute = { skillId: id, probability: rate};
				} else if (line.match(noteEffectsRace)) {
					var id = parseInt(RegExp.$1);
					var multi = parseInt(RegExp.$2);
					obj.effectsRace ={ race: id, rate: multi};
				} 
			}
		}
	};

	Window_BattleItem.prototype.makeItemList = function() {
		this._data = $gameParty.allItems().filter(function(item) {
			return this.includes(item);
		}, this);
	};
	
	Window_BattleItem.prototype.includes = function(item) {
		if (!item) return false;
		if (this._type === 12) return $gameParty.knowMix(item);
		return (item._type === this._type || (this._type === 35 && item._throwable))
				&& item._level < this._level 
				&& ($gameParty.canUse(item) || item._referItem || (this._type === 35 && item._throwable));
	};

	Window_BattleItem.prototype.needsNumber = function() {
		if ([12, 14].contains(this._type)) return false;
		return true;
	};

	Window_BattleItem.prototype.isEnabled = function(item) {
		if (this._type === 12) return $gameParty.canMix(item);
		return $gameParty.canUse(item) 
				|| (item && item._referItem) 
				|| (item && this._type === 35 && item._throwable);
	};

	Game_BattlerBase.prototype.meetsItemConditions = function(item) {
		return this.meetsUsableItemConditions(item) 
				&& ($gameParty.hasItem(item) || item._referBack);
	};

	Game_Battler.prototype.useItem = function(item) {
		if (DataManager.isSkill(item)) {
			if (item.id === 179) $gameParty.loseItem(item._thrownWeapon, 1);
			else this.paySkillCost(item);
		} else if (DataManager.isItem(item)) {
			if (item._referBack) {
				if (item.consumable) $gameParty.loseItem($dataWeapons[item._referBack], 1);
			} else if (item._mix.length === 2) {
				for (var i = 0; i < 2; i++) $gameParty.loseItem($dataItems[item._mix[i]], 1);
			} else this.consumeItem(item);
		}
	};

	Scene_Battle.prototype.onItemOk = function() {
		var item = this._itemWindow.item();
		var action = BattleManager.inputtingAction();
		if (this._itemWindow._type === 35) {
			action.throwAtk = item.params[2];
			action.setSkill(179);
			action.item()._thrownWeapon = item;
		} else if (item._referItem) {
			action.setItem(item._referItem);
		} else {
			action.setItem(item.id);
		}
		$gameParty.setLastItem(item);
		this.onSelectAction();
	};

	Game_Party.prototype.knowMix = function(item) {
		return item.itypeId === 4 && $gameParty.hasItem(item);
	}

	Game_Party.prototype.canMix = function(item) {
		if (item._mix.length > 1) {
			if (item._mix[0] === item._mix[1]) return this.numItems($dataItems[item._mix[0]]) > 1;
			else return this.numItems($dataItems[item._mix[0]]) > 0 && this.numItems($dataItems[item._mix[1]]) > 0;
		} else return false;
	}

})();