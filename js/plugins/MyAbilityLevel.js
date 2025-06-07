/*:
 * @plugindesc アビリティレベルによって使えるスキルが変わる処理
 * @author paisuygoda
 * @help タグでスキルとアビリティ防具のそれぞれにスキルレベルを設定する
 */

(function() {

	// 要求アビリティレベル読み込み
	var _loaded_AbilityLevel_Setting = false;
	var MyAbLe_DaMa_isDatabaseLoaded = DataManager.isDatabaseLoaded;
	DataManager.isDatabaseLoaded = function() {
	if (!MyAbLe_DaMa_isDatabaseLoaded.call(this)) return false;
	if (!_loaded_AbilityLevel_Setting) {
		this.processNotetagsAbilityLevel($dataSkills);
		this.processNotetagsAbilityLevel($dataItems);
		_loaded_AbilityLevel_Setting = true;
	}
		return true;
	};

	DataManager.processNotetagsAbilityLevel = function(group) {
		// 要求アビリティレベル(記述がなければ0)
		var noteAbLevelCondition = /<(?:RequireAbilityLevel):[ ](\d+)>/i;
		// ジャンプなどの二段階コマンドか否か(記述がなければfalse)
		var noteSerialSkillCondition = /<(?:SerialSkill)>/i;
		// 二段階目か否か(記述がなければfalse)
		var noteSubSkillCondition = /<(?:SubSkill)>/i;
		// 盗むスキルか否か(記述がなければfalse)
		var noteStealSkillCondition = /<(?:StealSkill)>/i;
		// 盗むスキルか否か(記述がなければfalse)
		var noteReversibleCondition = /<(?:Reversible)>/i;
		// 要求アビリティレベル(記述がなければ0)
		var noteLibraryLevelCondition = /<(?:LibrarySkill)>/i;
		// レベル系青魔法(記述がなければ0)
		var noteLevelSkillCondition = /<(?:LevelSkill):[ ](\d+)>/i;
		// リフレク貫通
		var notePassReflecCondition = /<(?:PassReflec)>/i;
		// レベル操作
		var noteManipLevelCondition = /<(?:ManipLevel):[ ](\d+)>/i;
		// 自己犠牲スキル
		var noteSacrificeSkillCondition = /<(?:Sacrifice):[ ](\d+)>/i;
		// 動的MPスキル
		var noteDynamicMp = /<(?:DynamicMp):[ ](\d+)>/i;
		// 究極スキル（フレア相当の技の判別に使用）
		var noteUlt = /<(?:UltimateSkill):[ ](\d+)>/i;
		// 敵味方全体攻撃スキル
		var noteTargetAll = /<(?:TargetsAll)>/i;
		// 使用者へのステート操作
		var noteAddState = /<(?:AddState:[ ](\d+))>/i;
		var noteRemoveState = /<(?:RemoveState:[ ](\d+))>/i;
		// 能力値操作
		var noteManipParam = /<(?:ManipParam:[ ](\d+)[ ](\d+))>/i;
		for (var n = 1; n < group.length; n++) {
			var obj = group[n];
			var notedata = obj.note.split(/[\r\n]+/);

			obj.abilityLevel = 2;
			obj.isSerialSkill = false;
			obj.isSubSkill = false;
			obj.isStealSkill = false;
			obj.isReversible = false;
			obj.isLibrary = false;
			obj.levelSkill = 0;
			obj.passReflec = false;
			obj.manipulateLevel = 0;
			obj.sacrificeLevel = 0;
			obj.dynamicMp = 0;
			obj.isUlt = false;
			obj.targetsAll = false;
			obj.addState = null;
			obj.removeState = null;
			obj.manipParam = null;

			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(noteAbLevelCondition)) {
					obj.abilityLevel = parseInt(RegExp.$1);
				} else if (line.match(noteSerialSkillCondition)) {
					obj.isSerialSkill = true;
				} else if (line.match(noteSubSkillCondition)) {
					obj.isSubSkill = true;
				} else if (line.match(noteStealSkillCondition)) {
					obj.isStealSkill = true;
				} else if (line.match(noteReversibleCondition)) {
					obj.isReversible = true;
				} else if (line.match(noteLibraryLevelCondition)) {
					obj.isLibrary = true;
				} else if (line.match(noteLevelSkillCondition)) {
					obj.levelSkill = parseInt(RegExp.$1);
				} else if (line.match(notePassReflecCondition)) {
					obj.passReflec = true;
				} else if (line.match(noteManipLevelCondition)) {
					obj.manipulateLevel = parseInt(RegExp.$1);
				} else if (line.match(noteSacrificeSkillCondition)) {
					obj.sacrificeLevel = parseInt(RegExp.$1);
				} else if (line.match(noteDynamicMp)) {
					obj.dynamicMp = parseInt(RegExp.$1);
				} else if (line.match(noteUlt)) {
					obj.isUlt = true;
				} else if (line.match(noteTargetAll)) {
					obj.targetsAll = true;
				} else if (line.match(noteAddState)) {
					obj.addState = parseInt(RegExp.$1);
				} else if (line.match(noteRemoveState)) {
					obj.removeState = parseInt(RegExp.$1);
				} else if (line.match(noteManipParam)) {
					var indexK = parseInt(RegExp.$1);
					var amountK = parseInt(RegExp.$2);
					obj.manipParam = { index: indexK, amount: amountK};
				}
			}
		}
	};
	
	Game_BattlerBase.prototype.canPaySkillCost = function(skill) {
		return this._tp >= this.skillTpCost(skill) 
			&& this._mp >= this.skillMpCost(skill) 
			&& this.haveSatisfyingSkill(skill.stypeId, skill.abilityLevel)
			// トランスは1戦闘に一回
			&& (skill.id == 74 ? !this._transed : true);
	};

	Game_BattlerBase.prototype.haveSatisfyingSkill = function(skillType, abilityLevel) {
		if (skillType == 0) return true;
		var level2 = abilityLevel > 1 ? this.addedSkillTypes().contains(skillType) : true;
		var level1 = level2 || (abilityLevel > 0 ? this.addedSkillTypes().contains(this.convertBackSkillType(skillType, 1)) : true);
		var level0 = level1 || (this.addedSkillTypes().contains(this.convertBackSkillType(skillType, 0)));
		return level0 && level1 && level2;
	};
	
	Game_Enemy.prototype.haveSatisfyingSkill = function(skillType, abilityLevel) {
		return true;
	};

	Game_BattlerBase.prototype.convertBackSkillType = function(skillType, abilityLevel) {
		if (abilityLevel == 0) {
			if (skillType == 1) return 15;
			else if (skillType == 2) return 17;
			else if (skillType == 3) return 19;
			else if (skillType == 4) return 21;
			else if (skillType == 6) return 23;
			else if (skillType == 10) return 25;
			else if (skillType == 11) return 27;
			else if (skillType == 13) return 29;
			else if (skillType == 14) return 31;
			else if (skillType == 9) return 33;
		}
		if (abilityLevel == 1) {
			if (skillType == 1) return 16;
			else if (skillType == 2) return 18;
			else if (skillType == 3) return 20;
			else if (skillType == 4) return 22;
			else if (skillType == 6) return 24;
			else if (skillType == 10) return 26;
			else if (skillType == 11) return 28;
			else if (skillType == 13) return 30;
			else if (skillType == 14) return 32;
		} 
	};

	MyAbLe_WiSkLi_initialize = Window_SkillList.prototype.initialize;
    Window_SkillList.prototype.initialize = function(x, y, width, height) {
		MyAbLe_WiSkLi_initialize.call(this, x, y, width, height);
		this._skillLevel = 3;
	};
	
	Window_SkillList.prototype.setStypeId = function(stypeId) {
		if (stypeId < 15 || stypeId === 34) {
			if (this._stypeId !== stypeId) {
				this._stypeId = stypeId;
				this._skillLevel = 3;
				this.refresh();
				this.resetScroll();
			}
		} else {
			var newStypeId = this.convertSkillType(stypeId);
			if (stypeId % 2 == 1) var newAbilityLevel = 1;
			else var newAbilityLevel = 2;
			if (this._stypeId !== newStypeId || this._skillLevel !== newAbilityLevel) {
				this._stypeId = newStypeId;
				this._skillLevel = newAbilityLevel;
				this.refresh();
				this.resetScroll();
			}
		}
	};

	Window_SkillList.prototype.includes = function(item) {
		return item && item.stypeId === this._stypeId && item.abilityLevel < this._skillLevel;
	};

	Window_SkillList.prototype.convertSkillType = function(stypeId) {
		if (stypeId < 17) return 1;
		else if (stypeId < 19) return 2;
		else if (stypeId < 21) return 3;
		else if (stypeId < 23) return 4;
		else if (stypeId < 25) return 6;
		else if (stypeId < 27) return 10;
		else if (stypeId < 29) return 11;
		else if (stypeId < 31) return 13;
		else if (stypeId < 33) return 14;
		else if (stypeId < 34) return 9;
		// ありえん
		else {
			console.log("invalid skillTypeId: " + stypeId);
			console.trace();
		}
	};

})();