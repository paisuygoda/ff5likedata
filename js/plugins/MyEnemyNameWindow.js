/*:
 * @plugindesc 敵の名前表示窓とポーズ状態表示窓追加
 * @author paisuygoda
 * @help 本体js編集用
 */

(function() {

	MyMi_ScBa_createAllWindows = Scene_Battle.prototype.createAllWindows;
	Scene_Battle.prototype.createAllWindows = function() {
		this.createBattleEnemyNamesWindow();
		MyMi_ScBa_createAllWindows.call(this);
	};

	Scene_Battle.prototype.createBattleEnemyNamesWindow = function() {
		this._battleEnemyNamesWindow = new Window_BattleEnemyNames(0, Graphics.boxHeight - (4 * 36 + 36));
		this.addWindow(this._battleEnemyNamesWindow);
		this._battleEnemyNamesWindow.show();
	};

	Scene_Battle.prototype.updateStatusWindow = function() {
		if ($gameMessage.isBusy()) {
			this._statusWindow.close();
			this._battleEnemyNamesWindow.close();
			this._partyCommandWindow.close();
			this._actorCommandWindow.close();
		} else if (this.isActive() && !this._messageWindow.isClosing()) {
			this._statusWindow.open();
			this._battleEnemyNamesWindow.open();
		}
	};

	Scene_Battle.prototype.stop = function() {
		Scene_Base.prototype.stop.call(this);
		if (this.needsSlowFadeOut()) {
			this.startFadeOut(this.slowFadeSpeed(), false);
		} else {
			this.startFadeOut(this.fadeSpeed(), false);
		}
		this._statusWindow.close();
		this._battleEnemyNamesWindow.close();
		this._partyCommandWindow.close();
		this._actorCommandWindow.close();
	};

	// 敵選択用でない、名前表示専用の窓
	function Window_BattleEnemyNames() {
		this.initialize.apply(this, arguments);
    }
    
	Window_BattleEnemyNames.prototype = Object.create(Window_BattleEnemy.prototype);
	Window_BattleEnemyNames.prototype.constructor = Window_BattleEnemyNames;
	Window_BattleEnemyNames.prototype.maxCols = function() {return 1;};
	Window_BattleEnemyNames.prototype.windowWidth = function() {return 300;};
	Window_BattleEnemyNames.prototype.itemWidth = function() {return 220;};
	Window_BattleEnemyNames.prototype.select = function(index) {};
    
    Window_BattleEnemyNames.prototype.initialize = function(x, y) {
		this._enemies = [];
		this._enemyCount = [];
		this._sorted = false;
		this._scrollX = 0;
		this._scrollY = 0;
		var width = this.windowWidth();
		var height = 4 * 36 + 36;
		Window_Base.prototype.initialize.call(this, x, y, width, height);
		this.refresh();
		this.hide();
    };
    
	Window_BattleEnemyNames.prototype.refresh = function() {
		if (this._sorted) this.refreshNames();
		else this.sortTargets();
		Window_Selectable.prototype.refresh.call(this);
		if (this.index() >= 0)
			this.select(this._index.clamp(0, this.maxItems() - 1));
    };
    
	Window_BattleEnemyNames.prototype.update = function() {
		Window_Base.prototype.update.call(this);
    };
    
	Window_BattleEnemyNames.prototype.drawAllItems = function() {
		for (var i = 0; i < this.maxPageItems(); i++) {
			if (i < this.maxItems()) {
				this.drawItem(i);
			}
		}
    }
    
	Window_BattleEnemyNames.prototype.drawItem = function(index) {
		this.resetTextColor();
		var name = this._enemies[index];
		var rect = this.itemRectForText(index);
		this.drawText(name, rect.x, rect.y, rect.width);
		var count = this._enemyCount[index];
		if (count > 1) {
			var countRect = this.itemRectForCount(index);
			this.drawText(count, countRect.x, countRect.y, countRect.width);
		}
    };
    
	Window_BattleEnemyNames.prototype.sortTargets = function() {
		this._enemies = this.allowedTargets();
		this._enemies.sort(function(a, b) {
			if (a.spritePosX() === b.spritePosX()) {
			  return a.spritePosY() - b.spritePosY();
			}
			return b.spritePosX() - a.spritePosX();
		});
		var displayEnemy = [];
		var enemyCount = this._enemyCount;
		this._enemies.forEach(function(enemy) {
			var enemyName = enemy.originalName();
			var index = displayEnemy.indexOf(enemyName);
			if (index >= 0) enemyCount[index] += 1;
			else {
				displayEnemy.push(enemyName);
				enemyCount.push(1);
			}
		});
		this._enemies = displayEnemy;
		if (displayEnemy.length > 0) this._sorted = true;
    };
    
	Window_BattleEnemyNames.prototype.refreshNames = function() {
		var enemies = this._enemies;
		var enemyCount = this._enemyCount;
		var curEnemies = this.allowedTargets();
		for (var i = 0; i < enemyCount.length; i++) enemyCount[i] = 0;
		curEnemies.forEach(function(enemy) {
			var enemyName = enemy.originalName();
			var index = enemies.indexOf(enemyName);
			if (index >= 0) enemyCount[index] += 1;
			else {
				enemies.push(enemyName);
				enemyCount.push(1);
			}
		});
		var newEnemies = [];
		var newEnemyCounts = [];
		for (var i = 0; i < enemyCount.length; i++) {
			if (enemyCount[i] > 0) {
				newEnemies.push(enemies[i]);
				newEnemyCounts.push(enemyCount[i]);
			}
		}
		this._enemies = newEnemies;
		this._enemyCount = newEnemyCounts;
    };
    
	Window_BattleEnemyNames.prototype.itemRectForCount = function(index) {
		var rect = this.itemRectCount(index);
		rect.x += this.textPadding();
		rect.width -= this.textPadding() * 2;
		return rect;
    };
    
	Window_BattleEnemyNames.prototype.itemRectCount = function(index) {
		var rect = new Rectangle();
		var maxCols = this.maxCols();
		rect.width = this.windowWidth() - this.itemWidth();
		rect.height = this.itemHeight();
		rect.x = this.itemWidth() + index % maxCols * rect.width;
		rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY;
		return rect;
	};
})();