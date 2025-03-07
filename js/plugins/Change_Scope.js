//=============================================================================
// Change_Scope.js
//=============================================================================

/*:
 * @plugindesc スキルを「敵<=>味方」に変更可能になります。
 * @author 村人C
 *
 * @help
 *
 * 使い方
 * 戦闘時、ターゲットを選択時に「Shift」を押すことで
 * 敵<=>味方
 * に変更可能になります。
 *
 * 仕様
 * 使用者、敵○体ランダム、全体対象には、適用されません。
 * スキルID１の「攻撃」も対象の切り替えが可能になります。
 *
 *
 * readmeやスタッフロールの明記、使用報告は任意
 *
 */
  
 (function() {
	 // フラグ
	var _Game_Battler_initMembers_Change_Scope = Game_Battler.prototype.initMembers;
	Game_Battler.prototype.initMembers = function() {
		_Game_Battler_initMembers_Change_Scope.call(this);
		this._change_scope = false; // 初期化
		this._changed = true; // 初期化
	};
	// ターゲットの配列作成
	Game_Action.prototype.makeTargets = function() {
		var rawTargets;
		// SerialSkillの時点で回避されたりバニシュが消えたりしても困るのでどこも対象にしない
		if (this.item().isSerialSkill) return [];
		// scopeに関係なく指定ターゲットを狙う処理(魔封剣で吸収時に使用)
		else if (this._forceTarget) return [this._forceTarget];
		// 敵味方全体攻撃
		else if (this.item().targetsAll) return this.friendsUnit().aliveMembers().concat(this.opponentsUnit().aliveMembers());
		else if (this.isForUser()) {
			rawTargets = [this.subject()];
		} else if (this._change_scope) {
			var targets = [];
			if (this.isForOpponent()) {
				targets = this.targetsForFriends(); // 入れ替え
			} else if (this.isForFriend()) {
				targets = this.targetsForOpponents(); // 入れ替え
			}
			rawTargets = this.repeatTargets(targets);
		} else {
			var targets = [];
			if (this.isForOpponent()) {
				targets = this.targetsForOpponents();
			} else if (this.isForFriend()) {
				targets = this.targetsForFriends();
			}
			rawTargets = this.repeatTargets(targets);
		}

		// 条件により効果対象から外す処理
		targets = [];
		var item = this.item();
		rawTargets.forEach(function(target){
			// 瀕死耐性がついているとき、割合&瀕死ダメージが当たらない
			if (!(target.isStateAffected(35) && item.damage.elementId === 12)
				// かくれる状態の時は自身の「あらわれる」以外当たらない DONE: あらわれるスキルIDのハードコーディング
				// ジャンプ中も当たらない
				&& !((target.isStateAffected(32) && item.id != 35) || target.isStateAffected(78))) {
					targets.push(target);
				}
		});
		return targets;
	};
	// 選択判定
	var _Scene_Battle_update_Change_Scope = Scene_Battle.prototype.update;
	Scene_Battle.prototype.update = function() {
		if (this._actorWindow.visible && !BattleManager.actor()._changed) { // 現在：味方
			BattleManager.actor()._changed = true;
			if (BattleManager.inputtingAction().item().isReversible) {
				BattleManager.actor()._change_scope = !BattleManager.actor()._change_scope;
				this._actorWindow.deactivate(); // 忘れるとエラー
				this._actorWindow.hide();
				this.selectEnemySelection(); // 切り替え
			}
		}else if (this._enemyWindow.visible && !BattleManager.actor()._changed) { // 現在：敵
			BattleManager.actor()._changed = true;
			if (BattleManager.inputtingAction().item().isReversible) {
				BattleManager.actor()._change_scope = !BattleManager.actor()._change_scope;
				this._enemyWindow.deactivate(); // 忘れるとエラー
				this._enemyWindow.hide();
				this.selectActorSelection(); // 切り替え
			}
		}
		_Scene_Battle_update_Change_Scope.call(this);
	};

	var Ch_Sc_GaAc_initialize = Game_Action.prototype.initialize;
	Game_Action.prototype.initialize = function(subject, forcing) {
	    Ch_Sc_GaAc_initialize.call(this, subject, forcing);
	    this._change_scope = null;
	};
	
	// Game_Actionに個別にChange_Scope情報を渡す
	Scene_Battle.prototype.onEnemyOk = function() {
		var action = BattleManager.inputtingAction();
		if (BattleManager.actor()._change_scope) {
			BattleManager.actor()._change_scope = false;
			action._change_scope = true;
		}
		action.setTarget(this._enemyWindow.enemyIndex());
		this._enemyWindow.hide();
		this._skillWindow.hide();
		this._itemWindow.hide();
		this.selectNextCommand();
	};
	Scene_Battle.prototype.onActorOk = function() {
		var action = BattleManager.inputtingAction();
		if (BattleManager.actor()._change_scope) {
			BattleManager.actor()._change_scope = false;
			action._change_scope = true;
		}
		action.setTarget(this._actorWindow.index());
		this._actorWindow.hide();
		this._skillWindow.hide();
		this._itemWindow.hide();
		this.selectNextCommand();
	};

	// 敵は混乱中も通常のルーティーンで技を出し、その対象を敵にする
	Game_Action.prototype.setConfusion = function() {
		if (this.subject().isActor()) {
			switch (this.subject().confusionLevel()) {
				case 2:
					if (Math.random() < 0.5) this._change_scope = true;
					else this._change_scope = false;
					break;
				case 3:
					this._change_scope = true;
					break;
				default:
					this._change_scope = false;
				}
			this.setAttack();
		}
		else this._change_scope = true;
	};
})();