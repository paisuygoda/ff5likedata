//=============================================================================
// SimpleMsgSideView.js
//=============================================================================

/*:
 * @plugindesc at sideview battle, only display item/skill names.
 * @author Sasuke KANNAZUKI
 *
 * @param displayAttack
 * @desc Whether to display normal attack. 1:yes 0:no
 * @default 0
 *
 * @param position
 * @desc Skill name display position. 0:left, 1:center
 * @default 1
 *
 * @help This plugin does not provide plugin commands.
 *
 * By not displaying the log and only displaying the skill name,
 * the speed of battle will increase slightly.
 */

/*:ja
 * @plugindesc サイドビューバトルで技/アイテムの名前のみ表示します。
 * @author 神無月サスケ
 *
 * @param displayAttack
 * @desc 通常攻撃/防御も表示するか (1:する 0:しない)
 * @default 0
 *
 * @param position
 * @desc 技名を表示する位置 (0:左寄せ, 1:中央)
 * @default 1
 *
 * @help このプラグインには、プラグインコマンドはありません。
 *
 * ログを表示せず、技名のみを表示することで、戦闘のテンポが若干高速になります。
 */

(function () {
  var parameters = PluginManager.parameters("SimpleMsgSideView");
  var displayAttack = Number(parameters["displayAttack"]) != 0;
  var position = Number(parameters["position"] || 1);

  var _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
  Window_BattleLog.prototype.addText = function (text) {
    if ($gameSystem.isSideView()) {
      this.refresh();
      this.wait();
      return; // not display battle log
    }
    _Window_BattleLog_addText.call(this, text);
  };

  // for sideview battle only
  Window_BattleLog.prototype.addItemNameText = function (itemName) {
    this._lines.push(itemName);
    this.refresh();
    this.wait();
  };

  // たたかうに属する、技名を表示しないスキルたち TODO: たたかうスキルをハードコーディング
  Window_BattleLog.prototype.notShownSkills = function () {
    return [
      1, 3, 4, 5, 11, 12, 13, 14, 15, 16, 17, 18, 19, 27, 200, 203, 235, 271,
      272, 273, 275, 279, 288, 289, 290,
    ];
  };

  // 表示時に名前を変更するスキルはここで変更
  Window_BattleLog.prototype.getDisplayName = function (item, subject) {
    switch (item.id) {
      case 158:
        return "フェアリーブライトン";
      case 159:
        return "まとわりつき";
      case 160:
        return "地獄の火炎";
      case 161:
        return "裁きの雷";
      case 162:
        return "ダイアモンドダスト";
      case 163:
        return "風のささやき";
      case 164:
        return "ルナティックボイス";
      case 165:
        return "大地の怒り";
      case 166:
        return "アースウォール";
      case 167:
        return "ルビーの光";
      case 168:
        return "サンダーストーム";
      case 169:
        return "斬鉄剣";
      case 170:
        return "転生の炎";
      case 171:
        return "大海嘯";
      case 172:
        return "メガフレア";
      case 173:
        return "メタモルフォース";
      case 264:
        if (subject.isStateAffected(123)) return "烈狼の構え";
        else return "堅丑の構え";
      default:
        return item.name;
    }
  };

  var _Window_BattleLog_displayAction =
    Window_BattleLog.prototype.displayAction;
  Window_BattleLog.prototype.displayAction = function (subject, item) {
    if ($gameSystem.isSideView()) {
      if (
        displayAttack ||
        !(
          DataManager.isSkill(item) &&
          (this.notShownSkills().contains(item.id) ||
            item.id == subject.guardSkillId())
        )
      ) {
        this.push("addItemNameText", this.getDisplayName(item, subject)); // display item/skill name
      } else {
        this.push("wait");
      }
      return;
    }
    _Window_BattleLog_displayAction.call(this, subject, item);
  };

  // to put skill/item name at center
  var _Window_BattleLog_drawLineText = Window_BattleLog.prototype.drawLineText;
  Window_BattleLog.prototype.drawLineText = function (index) {
    if ($gameSystem.isSideView() && position == 1) {
      var rect = this.itemRectForText(index);
      this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
      this.drawText(this._lines[index], rect.x, rect.y, rect.width, "center");
      return;
    }
    _Window_BattleLog_drawLineText.call(this, index);
  };
})();
