//=============================================================================
// MPP_ActiveTimeBattle.js
//=============================================================================
// Copyright (c) 2016-2019 Mokusei Penguin
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc 【ver.2.13】戦闘システムをアクティブタイムバトルに変更します。
 * @author 木星ペンギン
 *
 * @help ▼ システム説明
 * --------------------------------
 *  〇 パーティコマンド
 *   アクターコマンド選択中か、誰もコマンド入力を行っていない状態で
 *   キャンセルキーを押すとパーティコマンドを開くことができます。
 *
 *   パーティコマンドを開いている間は、どの戦闘モードでも時間が止まります。
 *   一時停止の代わりです。
 *
 * --------------------------------
 *  〇 バトルイベントの実行
 *   イベント実行中にも時間は止まります。
 *
 * --------------------------------
 *  〇 戦闘モード（active, slow, wait, stop）
 *   active : 常に時間が流れます。
 *   slow   : 常に時間が経過しますが、コマンド入力中は時間の流れが遅くなり、
 *            そうでない場合は常に加速されます。
 *   wait   : スキルやアイテム、対象選択中は時間が止まります。
 * 　         アクターコマンド入力中は時間が流れます。
 *   stop   : コマンド入力中は常に時間が止まります。
 *            アクターコマンド入力中に加速ボタンを押すと時間が流れます。
 *
 *   ※どのモードでもパーティコマンド選択中、イベント実行中は時間が止まります。
 *
 * --------------------------------
 *  〇 ATゲージ
 *   ATゲージの最大値は
 *    1.パーティメンバーの敏捷性の平均値（敵は含まない）
 *    2.オプションによるプレイヤーの設定
 *    3.プラグインコマンドで設定した基準値
 *   によって決定されます。
 *
 *   ATゲージの増加量は
 *    キャラクターの敏捷性 + 増加値
 *   です。
 *   プラグインコマンドで設定した[増加値]が大きいほど、
 *   敏捷性の影響が小さくなります。
 *
 * --------------------------------
 *  〇 逃げる
 *   戦闘可能なキャラ全員が逃走に必要なATをためると逃走判定を行います。
 *   逃走に失敗しても逃走状態は解除されません。
 *   パーティコマンドで戦うを選択すると解除されます。
 *
 * --------------------------------
 *  〇 アイテム/スキルの詠唱時間
 *   アイテム/スキルの速度補正をマイナスにすることで、詠唱時間が発生します。
 *   速度補正を-1するごとに約0.5秒の詠唱時間となります。
 *   詠唱が終わった時点で、行動順リストに入ります。
 *
 *   詠唱時間はオプションの[戦闘速度]の設定によって上下します。
 *   [戦闘速度の基準値]を変えても変化しません。
 *
 * --------------------------------
 *  〇 複数回行動
 *   特徴の[行動回数追加]によって２回以上の行動が可能になった際の動作は
 *   保証しません。
 *   １回行動になるようにしてください。
 *
 * ================================================================
 * ▼ 操作関連
 * --------------------------------
 *  〇 加速ボタン
 *   ゲームパッドではXボタン、キーボードではShift、
 *   タッチ操作ではステータスウィンドウより上をタッチし続けることで加速します。
 *   ただし、メッセージウィンドウが表示されている場合は加速しません。
 *
 * --------------------------------
 *  〇 コマンド入力を行うアクターの切り替え
 *   ゲームパッドではLB/RBボタン、キーボードではQ、Page up/W、Page down、
 *   タッチ操作ではステータスウィンドウをタッチすることで
 *   選択した対象に切り替えることができます。
 *   （正確にはタッチを離した際に切り替わります）
 *
 * --------------------------------
 *  〇 ステータスウィンドウのスクロール
 *   タッチ操作でタッチしたままウィンドウを上下に動かすと
 *   スクロールさせることができます。
 *   パーティメンバーがステータスウィンドウに収まらない場合の処置です。
 *
 * ================================================================
 * ▼ プラグインパラメータ 詳細
 * --------------------------------
 *  〇 Escape Anime? (逃走状態で逃走モーションを行うかどうか)
 *   有効にすると逃走状態にある間アクターは逃走モーションを行います。
 *   デフォルトでは後ろ向きに走るモーションはありません。
 * 
 * --------------------------------
 *  〇 Change Mode in Battle _v2 (戦闘中に戦闘モードを変更可能にするかどうか)
 *   戦闘モードの変更はパーティコマンドから行えます。
 * 
 * ================================
 * 制作 : 木星ペンギン
 * URL : http://woodpenguin.blog.fc2.com/
 *
 * @param === Base ===
 * @default 【基本設定】
 *
 * @param ATB Mode Default _v2
 * @type select
 * @option active
 * @option slow
 * @option wait
 * @option stop
 * @desc 戦闘モードのデフォルト値
 * @default wait
 * @parent === Base ===
 *
 * @param ATB Speed Base
 * @type number
 * @min 1
 * @desc 戦闘速度の基準値
 * ゲーム内での変更はできない制作者側の設定
 * @default 6
 * @parent === Base ===
 *
 * @param AT Increment
 * @type number
 * @desc ATゲージの増加値
 * @default 10
 * @parent ATB Speed Base
 *
 * @param ATB Speed Default
 * @type number
 * @max 4
 * @desc 戦闘速度のデフォルト値(0～4)
 * ゲーム内のオプションから変更できる値
 * @default 2
 * @parent === Base ===
 *
 * @param Mode Slow Fast Rate
 * @type number
 * @decimals 2
 * @desc 戦闘モード[slow]時のコマンド入力中でない場合の時間加速度
 * @default 1.5
 * @parent === Base ===
 *
 * @param Mode Slow Rate
 * @type number
 * @decimals 2
 * @desc 戦闘モード[slow]時のコマンド入力中の時間加速度
 * @default 0.5
 * @parent === Base ===
 *
 * @param Stop Time On Action
 * @type boolean
 * @desc アクション中に時間を止めるかどうか
 * @default false
 * @parent === Base ===
 *
 * @param Instant Stop On Command
 * @type number
 * @desc ターンが回ってから時間を止めるフレーム数
 * @default 0
 * @parent === Base ===
 *
 *
 * @param === Option ===
 * @default 【オプション画面】
 *
 * @param ATB Mode Name _v2
 * @desc オプションで表示する戦闘モードの項目名
 * (空の場合オプションには追加されません)
 * @default 戦闘モード
 * @parent === Option ===
 *
 * @param ATB Mode Status _v2
 * @type select[]
 * @option active
 * @option slow
 * @option wait
 * @option stop
 * @desc オプションで表示する戦闘モードの表示順
 * @default ["active","slow","wait","stop"]
 * @parent ATB Mode Name _v2
 *
 * @param ATB Mode Texts _v2
 * @type struct<ModeStatus>
 * @desc 用語[戦闘モード]
 * @default {"active":"アクティブ","slow":"スロー","wait":"ウェイト","stop":"ストップ"}
 * @parent ATB Mode Name _v2
 *
 * @param ATB Speed Name
 * @desc オプションで表示する戦闘速度の項目名
 * (空の場合オプションには追加されません)
 * @default 戦闘速度
 * @parent === Option ===
 *
 * @param ATB Speed Status
 * @desc オプションで表示する戦闘速度のステータス名
 * （カンマで区切ってください）
 * @default 1,2,3,4,5
 * @parent ATB Speed Name
 *
 *
 * @param === ATB Fast ===
 * @default 【加速ボタン関連】
 *
 * @param ATB Fast Eneble?
 * @type boolean
 * @desc 加速ボタンの有効/無効
 * @default true
 * @parent === ATB Fast ===
 *
 * @param ATB Fast Rate
 * @type number
 * @decimals 2
 * @desc 加速ボタンを押したときの加速度
 * @default 2.0
 * @parent ATB Fast Eneble?
 *
 * @param Fast Cancel By Input
 * @type boolean
 * @desc コマンド入力を行う際、加速を一旦解除するかどうか
 * @default true
 * @parent === ATB Fast ===
 *
 * @param Fast Log Eneble?
 * @type boolean
 * @desc 戦闘ログ早送りの有効/無効
 * 戦闘ログ早送りはツクールデフォルトの機能です
 * @default true
 * @parent === ATB Fast ===
 *
 *
 * @param === Battle ===
 * @default 【戦闘関連】
 *
 * @param Change Mode in Battle _v2
 * @type boolean
 * @desc 戦闘中に[戦闘モード]を変更可能にするかどうか
 * @default false
 * @parent === Battle ===
 *
 * @param Reset AT Die?
 * @type boolean
 * @desc 戦闘不能時にATゲージをリセットするかどうか？
 * @default true
 * @parent === Battle ===
 *
 * @param Need Escape At
 * @type number
 * @max 100
 * @desc 逃走に必要なATゲージの割合(0～100)
 * @default 100
 * @parent === Battle ===
 *
 * @param Escape AT Cost
 * @type number
 * @max 100
 * @desc 逃走失敗時に消費されるATゲージの割合(0～100)
 * @default 75
 * @parent === Battle ===
 *
 * @param Escape Anime?
 * @type boolean
 * @desc 逃走状態で逃走モーションを行うかどうか
 * @default false
 * @parent === Battle ===
 *
 * @param Input Step Forward?
 * @type boolean
 * @desc コマンド入力中に前進するかどうか
 * @default false
 * @parent === Battle ===
 *
 * @param Active SE _v2
 * @type struct<SE>
 * @desc 行動順が回ってきたときのSE
 * @default {"Name":"Decision1","Volume":"90","Pitch":"100","Pan":"0"}
 * @parent === Battle ===
 *
 * @param Force Target Select?
 * @type boolean
 * @desc 全てのスキル/アイテムで対象選択を行うかどうか
 * @default true
 * @parent === Battle ===
 *
 *
 * @param === Window ===
 * @default 【ウィンドウ】
 *
 * @param Help Window Pos
 * @type number
 * @min -1
 * @max 1
 * @desc ヘルプウィンドウの位置
 * (-1:非表示, 0:上, 1:ステータスの上)
 * @default 1
 * @parent === Window ===
 *
 * @param Help Window Row
 * @type number
 * @desc ヘルプウィンドウの行数
 * @default 1
 * @parent === Window ===
 *
 * @param Status Window Pos
 * @type number
 * @max 2
 * @desc ステータスウィンドウの位置
 * (0:左寄せ, 1:中央, 2:右寄せ)
 * @default 2
 * @parent === Window ===
 *
 * @param Skill Window HP Draw?
 * @type boolean
 * @desc スキルウィンドウ表示中にＨＰを表示するかどうか
 * @default false
 * @parent === Window ===
 *
 *
 * @param === AT Gauge ===
 * @default 【ATゲージ】
 *
 * @param AT Gauge Name
 * @desc ATゲージ名
 * @default
 * @parent === AT Gauge ===
 *
 * @param AT Gauge Width
 * @type number
 * @desc ATゲージの幅
 * @default 60
 * @parent === AT Gauge ===
 *
 * @param AT Gauge Height
 * @type number
 * @desc ATゲージの高さ
 * @default 12
 * @parent === AT Gauge ===
 *
 * @param AT Charge Color1
 * @desc ATゲージ増加中の色1(RGBで指定)
 * @default 192,192,192
 * @parent === AT Gauge ===
 *
 * @param AT Charge Color2
 * @desc ATゲージ増加中の色2(RGBで指定)
 * @default 255,255,255
 * @parent === AT Gauge ===
 *
 * @param AT Max Color1
 * @desc ATゲージMaxの色1(RGBで指定)
 * @default 192,192,192
 * @parent === AT Gauge ===
 *
 * @param AT Max Color2
 * @desc ATゲージMaxの色2(RGBで指定)
 * @default 255,255,192
 * @parent === AT Gauge ===
 *
 * @param Chanting View?
 * @type boolean
 * @desc 詠唱ゲージを表示するかどうか
 * @default true
 * @parent === AT Gauge ===
 *
 * @param AT Chanting Color1
 * @desc 詠唱ゲージの色1(RGBで指定)
 * @default 128,32,0
 * @parent Chanting View?
 *
 * @param AT Chanting Color2
 * @desc 詠唱ゲージの色2(RGBで指定)
 * @default 255,64,0
 * @parent Chanting View?
 *
 * @param Escaping Change?
 * @type boolean
 * @desc 逃走中にゲージの色を変更するかどうか
 * @default true
 * @parent === AT Gauge ===
 *
 * @param AT Escaping Color1
 * @desc 詠唱ゲージの色1(RGBで指定)
 * @default 192,192,192
 * @parent Escaping Change?
 *
 * @param AT Escaping Color2
 * @desc 詠唱ゲージの色2(RGBで指定)
 * @default 192,192,255
 * @parent Escaping Change?
 *
 */

/*~struct~ModeStatus:
 * @param active
 * @default アクティブ
 * 
 * @param slow
 * @default スロー
 * 
 * @param wait
 * @default ウェイト
 * 
 * @param stop
 * @default ストップ
 * 
 */

/*~struct~SE:
 * @param Name
 * @desc ファイル名
 * @default Decision1
 * @require 1
 * @dir audio/se
 * @type file
 *
 * @param Volume
 * @type number
 * @max 100
 * @desc 音量
 * @default 90
 *
 * @param Pitch
 * @type number
 * @min 50
 * @max 150
 * @desc ピッチ
 * @default 100
 *
 * @param Pan
 * @type number
 * @min -100
 * @max 100
 * @desc 位相
 * @default 0
 *
 */

function Window_AtbSkillStatus() {
    this.initialize.apply(this, arguments);
}

var MPPATB_Variable = {};
MPPATB_Variable.commandPause = 0;

(function() {

const MPPlugin = {};

{
    
    let parameters = PluginManager.parameters('MPP_ActiveTimeBattle');
    
    //=== Base ===
    MPPlugin.atbMode = parameters['ATB Mode Default _v2'] || "wait";
    MPPlugin.atbSpeedBase = Number(parameters['ATB Speed Base'] || 6);
    MPPlugin.atIncrement = Number(parameters['AT Increment'] || 10);
    MPPlugin.atbSpeed = Number(parameters['ATB Speed Default'] || 2).clamp(0, 4);
    MPPlugin.ModeSlowFastRate = Number(parameters['Mode Slow Fast Rate'] || 2);
    MPPlugin.ModeSlowRate = Number(parameters['Mode Slow Rate'] || 0.25);
    MPPlugin.StopTimeOnAction = !!eval(parameters['Stop Time On Action']);
    MPPlugin.StopFrame = Number(parameters['Instant Stop On Command'] || 0);
    
    //=== Option ===
    MPPlugin.atbModeName = parameters['ATB Mode Name _v2'];
    MPPlugin.atbModeStatus = JSON.parse(parameters['ATB Mode Status _v2']);
    MPPlugin.atbModeTexts = JSON.parse(parameters['ATB Mode Texts _v2']);
    MPPlugin.atbSpeedName = parameters['ATB Speed Name'];
    MPPlugin.atbSpeedStatus = (parameters['ATB Speed Status'] || '1,2,3,4,5').split(',');

    //=== ATB Fast ===
    MPPlugin.atbFastEneble = !!eval(parameters['ATB Fast Eneble?']);
    MPPlugin.atbFastRate = Number(parameters['ATB Fast Rate'] || 3);
    MPPlugin.FastCancelByInput = !!eval(parameters['Fast Cancel By Input']);
    MPPlugin.fastLogEneble = !!eval(parameters['Fast Log Eneble?']);

    //=== Battle ===
    MPPlugin.ChangeModeInBattle = !!eval(parameters['Change Mode in Battle _v2']);
    MPPlugin.resetAtDie = !!eval(parameters['Reset AT Die?']);
    MPPlugin.needEscapeAt = Number(parameters['Need Escape At'] || 100).clamp(0, 100);
    MPPlugin.escapeAtCost = Number(parameters['Escape At Cost'] || 75).clamp(0, 100);
    MPPlugin.escapeAnime = !!eval(parameters['Escape Anime?']);
    MPPlugin.inputStepForward = !!eval(parameters['Input Step Forward?']);
    let se = JSON.parse(parameters['Active SE _v2']);
    MPPlugin.ActiveSE = {
        name:se.Name || "",
        volume:Number(se.Volume || 90),
        pitch:Number(se.Pitch || 100),
        pan:Number(se.Pan || 0)
    };
    MPPlugin.ForceTargetSelect = !!eval(parameters['Force Target Select?'] || "true");

    //=== Window ===
    MPPlugin.helpWindowPos = Number(parameters['Help Window Pos'] || 1).clamp(-1, 1);
    MPPlugin.helpWindowRow = Number(parameters['Help Window Row'] || 1).clamp(0, 2);
    MPPlugin.stWindowPos = Number(parameters['Status Window Pos'] || 1).clamp(0, 2);
    MPPlugin.SkillWindowHpDraw = !!eval(parameters['Skill Window HP Draw?']);

    //=== AT Gauge ===
    MPPlugin.atGaugeName = parameters['AT Gauge Name'] || '';
    MPPlugin.atGaugeWidth = Number(parameters['AT Gauge Width'] || 84);
    MPPlugin.atGaugeHeight = Number(parameters['AT Gauge Height'] || 12);
    MPPlugin.atChargeColor1 = 'rgb(%1)'.format(parameters['AT Charge Color1'] || '192,192,192');
    MPPlugin.atChargeColor2 = 'rgb(%1)'.format(parameters['AT Charge Color2'] || '255,255,255');
    MPPlugin.atMaxColor1 = 'rgb(%1)'.format(parameters['AT Max Color1'] || '192,192,192');
    MPPlugin.atMaxColor2 = 'rgb(%1)'.format(parameters['AT Max Color2'] || '255,255,192');
    MPPlugin.chantingView = !!eval(parameters['Chanting View?']);
    MPPlugin.atChantingColor1 = 'rgb(%1)'.format(parameters['AT Chanting Color1'] || '128,32,0');
    MPPlugin.atChantingColor2 = 'rgb(%1)'.format(parameters['AT Chanting Color2'] || '255,64,0');
    MPPlugin.EscapingChange = !!eval(parameters['Escaping Change?']);
    MPPlugin.atEscapingColor1 = 'rgb(%1)'.format(parameters['AT Escaping Color1'] || '192,192,192');
    MPPlugin.atEscapingColor2 = 'rgb(%1)'.format(parameters['AT Escaping Color2'] || '192,192,255');
    MPPlugin.firstLoop = true;
    
}

const Alias = {};

//=============================================================================
// Option
//=============================================================================

//-----------------------------------------------------------------------------
// MppOptions

function MppOptions() {
    throw new Error('This is a static class');
}

MppOptions.params = [];
MppOptions.params.push({
    symbol:'atbMode',
    name:  MPPlugin.atbModeName,
    status:MPPlugin.atbModeStatus.map( (mode) => MPPlugin.atbModeTexts[mode] ),
    def:   Math.max(MPPlugin.atbModeStatus.indexOf(MPPlugin.atbMode), 0)
},{
    symbol:'atbSpeed',
    name:  MPPlugin.atbSpeedName,
    status:MPPlugin.atbSpeedStatus,
    def:   MPPlugin.atbSpeed
});

Object.defineProperties(MppOptions, {
    atbMode  : { get: function() { return this.getter('atbMode'); } },
    atbSpeed : { get: function() { return this.getter('atbSpeed'); } }
});

MppOptions.isSymbol = function(symbol) {
    return this.params.some( (param) => param.symbol === symbol );
};

MppOptions.getStatus = function(symbol) {
    for (var i = 0; i < this.params.length; i++) {
        if (this.params[i].symbol === symbol)
            return this.params[i].status;
    }
    return [];
};

MppOptions.getter = function(symbol) {
    for (var i = 0; i < this.params.length; i++) {
        var param = this.params[i];
        if (param.symbol === symbol) {
            if (symbol === 'atbMode') {
                var atbMode = MPPlugin.atbMode;
                if (param.name) {
                    var modeIndex = ConfigManager[param.symbol];
                    atbMode = MPPlugin.atbModeStatus[modeIndex];
                }
                return atbMode;
            }
            return param.name ? ConfigManager[param.symbol] : param.def;
        }
    }
    return 0;
};

//-----------------------------------------------------------------------------
// ConfigManager

for (let i = 0; i < MppOptions.params.length; i++) {
    let param = MppOptions.params[i];
    ConfigManager[param.symbol] = param.def;
}

ConfigManager.onAtbMode = function() {
    var status = MppOptions.getStatus('atbMode');
    var value = this.atbMode;
    value++;
    if (value >= status.length) value = 0;
    value = value.clamp(0, status.length - 1);
    this.atbMode = value;
};

//71
Alias.CoMa_makeData = ConfigManager.makeData;
ConfigManager.makeData = function() {
    var config = Alias.CoMa_makeData.apply(this, arguments);
    var params = MppOptions.params;
    for (var i = 0; i < params.length; i++) {
        var symbol = params[i].symbol;
        config[symbol] = this[symbol];
    }
    return config;
};

//82
Alias.CoMa_applyData = ConfigManager.applyData;
ConfigManager.applyData = function(config) {
    Alias.CoMa_applyData.apply(this, arguments);
    var params = MppOptions.params;
    for (var i = 0; i < params.length; i++) {
        var symbol = params[i].symbol;
        if (typeof config[symbol] === 'number')
            this[symbol] = config[symbol];
    }
};

//-----------------------------------------------------------------------------
// Window_Options

//31
Alias.WiOp_makeCommandList = Window_Options.prototype.makeCommandList;
Window_Options.prototype.makeCommandList = function() {
    var params = MppOptions.params;
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        if (param.name)
            this.addCommand(param.name, param.symbol);
    }
    Alias.WiOp_makeCommandList.apply(this, arguments);
};

//62
Alias.WiOp_statusText = Window_Options.prototype.statusText;
Window_Options.prototype.statusText = function(index) {
    var symbol = this.commandSymbol(index);
    if (MppOptions.isSymbol(symbol)) {
        var status = MppOptions.getStatus(symbol);
        var value = this.getConfigValue(symbol);
        return status[value];
    } else {
        return Alias.WiOp_statusText.apply(this, arguments);
    }
};

//84
Alias.WiOp_processOk = Window_Options.prototype.processOk;
Window_Options.prototype.processOk = function() {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    if (MppOptions.isSymbol(symbol)) {
        var status = MppOptions.getStatus(symbol);
        var value = this.getConfigValue(symbol);
        value++;
        if (value >= status.length) value = 0;
        value = value.clamp(0, status.length - 1);
        this.changeValue(symbol, value);
    } else {
        Alias.WiOp_processOk.apply(this, arguments);
    }
};

//100
Alias.WiOp_cursorRight = Window_Options.prototype.cursorRight;
Window_Options.prototype.cursorRight = function(wrap) {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    if (MppOptions.isSymbol(symbol)) {
        var status = MppOptions.getStatus(symbol);
        var value = this.getConfigValue(symbol);
        value++;
        value = value.clamp(0, status.length - 1);
        this.changeValue(symbol, value);
    } else {
        Alias.WiOp_cursorRight.apply(this, arguments);
    }
};

//113
Alias.WiOp_cursorLeft = Window_Options.prototype.cursorLeft;
Window_Options.prototype.cursorLeft = function(wrap) {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    if (MppOptions.isSymbol(symbol)) {
        var status = MppOptions.getStatus(symbol);
        var value = this.getConfigValue(symbol);
        value--;
        value = value.clamp(0, status.length - 1);
        this.changeValue(symbol, value);
    } else {
        Alias.WiOp_cursorLeft.apply(this, arguments);
    }
};

//=============================================================================
// Main
//=============================================================================

//-----------------------------------------------------------------------------
// BattleManager

//10
Alias.BaMa_setup = BattleManager.setup;
BattleManager.setup = function(troopId, canEscape, canLose) {
    Alias.BaMa_setup.apply(this, arguments);
    var rate = (7 - MppOptions.atbSpeed) * MPPlugin.atbSpeedBase * 16;
    this._maxAt = Math.max(Math.round($gameParty.agility() * rate), 10);
    this._refreshHandler = null;
    this._waitHandler = null;
    this._escaping = false;
    this._atbFast = false;
    this._turnCount = 0;
    this._dualWielding = false;
    this._tempWeapon = null;
    this._waitAnim = 0;
    this._specialSkills = [];
    this._special = null;
    
	// ものまね用スロットを初期化
    this._lastActionItem = null;
    $gameTroop._lastActionItem = null;
    $gameParty._lastActionItem = null;
    $gameParty.allMembers().forEach(function(actor){
        actor._lastActionItem = null;
    });
    
	// 戦闘ごとにリセットされるステータス
    BattleManager._learnedSkill = [];
    $gameParty.members().forEach(function(actor){actor._transed = false;});
    // ゴーレムのＨＰのリセット
    $gameParty._golemHp = 0;
};

BattleManager.atbMode = function() {
    return MppOptions.atbMode;
};

BattleManager.maxAt = function() {
    return this._maxAt;
};

BattleManager.setEscaping = function(escaping) {
    this._escaping = escaping;
    $gameParty.requestMotionRefresh();
};

BattleManager.isEscaping = function() {
    return this._escaping;
};

BattleManager.needEscapeAt = function() {
    return MPPlugin.needEscapeAt / 100;
};

BattleManager.escapeAtCost = function() {
    return MPPlugin.escapeAtCost / 100;
};

//114
Alias.BaMa_update = BattleManager.update;
BattleManager.update = function() {
    this.updateATB();
    this.updateCmdActor();
    Alias.BaMa_update.apply(this, arguments);
};

BattleManager.updateATB = function() {
    if (!this._atbFast && this.isTriggeredFast()) {
        this._atbFast = true;
    } else if (this._atbFast && !this.isPressedFast()) {
        this._atbFast = false;
    }
    if (Graphics.frameCount % 2 === 0) {
        if (MPPATB_Variable.commandPause > 0 ){
            MPPATB_Variable.commandPause--;
            var selectPause = true;
        } else var selectPause = false;
        // クイックへの分岐
        if (this.isUnderQuick()) {
            if (this._quickActor._decided == 1) this.addActionBattler(this._quickActor);
            else if (this._quickActor._decided == 0) {
                this._quickActor._at = BattleManager.maxAt();
                this._quickActor.makeActions();
            }
        } else {
            var allBattlers = this.allBattleMembers();
            if (!this.isAtbWait() && !selectPause) {
                var rate = this.atbRealRate();
                // if (this.isAtbWait() || selectPause) rate /= 4;
                for (var i = 0; i < allBattlers.length; i++) {
                    var reached = allBattlers[i].updateATB(rate);
                    if(reached && allBattlers[i].isActor()) {
                        MPPATB_Variable.commandPause += MPPlugin.StopFrame;
                    }
                }
            }
            for (var i = 0; i < allBattlers.length; i++) {
                if (allBattlers[i].isMadeAction()) 
                    this.addActionBattler(allBattlers[i]);
            }
        }
    }
};

BattleManager.isUnderQuick = function() {
    return !!this._quickActor;
};

BattleManager.isTriggeredFast = function() {
    return Input.isTriggered('shift') ||
            (TouchInput.isTriggered() && TouchInput.y < this._statusWindow.y);
};

BattleManager.isPressedFast = function() {
    return Input.isPressed('shift') ||
            (TouchInput.isPressed() && TouchInput.y < this._statusWindow.y);
};

BattleManager.atbRealRate = function() {
    if (this.isFastForward()) {
        return MPPlugin.atbFastRate;
    } else if (this.atbMode() === "slow") {
        if (this.actor()) {
            return MPPlugin.ModeSlowRate;
        } else {
            return MPPlugin.ModeSlowFastRate;
        }
    } else {
        return 1;
    }
};

BattleManager.updateCmdActor = function() {
    // evantWaitのうち、イベントが走っているだけの分にはアクターコマンドを閉じない
    if ($gameMessage.isBusy()) {
        return this.clearActor();
    } else if (!this.isAtbWait() && !this.actor()) {
        var members = $gameParty.battleMembers();
        for (var i = 0; i < members.length; i++) {
            if (members[i].isStandby())
                return this.changeActor(i);
        }
    } else if (this.actor() && !this.actor().isStandby()) {
        this.clearActor();
    }
};

BattleManager.addActionBattler = function(battler) {
    this._actionBattlers.push(battler);
    battler.setDecided(2);
};

BattleManager.deleteDeactiveBattler = function() {
    this._actionBattlers = this._actionBattlers.filter(function(battler) {
        if (battler.atRate() === 1 || (battler._isCounter && battler.canMove())) {
            return true;
        } else {
            battler.setDecided(0);
            return false;
        }
    });
    if (this.actor() && !this.actor().isStandby()) {
        this.clearActor();
    }
};

BattleManager.isFastForward = function() {
    return MPPlugin.atbFastEneble && this._atbFast;
};

BattleManager.isEvantWait = function() {
    return $gameTroop.isEventRunning() || $gameMessage.isBusy();
};

BattleManager.isAtbWait = function() {
    if (MPPlugin.StopTimeOnAction && this._subject)
        return true;
    return (this.isEvantWait() || this._waitHandler());
};

//221
Alias.BaMa_startBattle = BattleManager.startBattle;
BattleManager.startBattle = function() {
    Alias.BaMa_startBattle.apply(this, arguments);

    // 戦闘開始時に仮想レベルをセット
    this.allBattleMembers().forEach(function(actor) { 
        actor.blv = actor._level;
        actor.clearResult();
    });
    // アクターの必殺ゲージをセット
    // ミラージュベストの分身をセット
    $gameParty.members().forEach(function(actor) { 
        actor._ultCount = 4 - actor._jobLevel[18];
        if (actor.isStateAffected(142)) {
            actor.addNewState(27);
            actor._blinks += 1;
        }
    });
    // 敵のアイテム所持状況をセット
    $gameTroop._enemies.forEach(function(enemy) { 
        enemy.haveItem = [true, true, true];
    });
    // フォースフィルド状況をセット
    this._forceField = [];
    // クイック中アクターをリセット
    this._quickActor = null;
    // 予言状況をリセット
    this._prophecy = null;
    this._remainingLog = false;
    this._isInstantSkill = false;
    this.setupAllBattlerAt();
    this._phase = 'turn';
    this.startTurn();
};

BattleManager.setupAllBattlerAt = function() {
    if (this._preemptive) {
        $gameParty.members().forEach( member => member.setAt(1) );
    } else if (this._surprise) {
        $gameParty.members().forEach( member => member.setAt(member.isStateAffected(134) ? 1 : 0.8 * Math.random()));
        $gameTroop.members().forEach( member => member.setAt(1) );
    } else {
        $gameParty.members().forEach( member => member.setAt(0.8 * Math.random()) );
        this.setupBattlerAtByATB();
        $gameTroop.members().forEach( member => member.setAt(0.8 * Math.random()) );
    }
    this.refreshStatus();
};

BattleManager.setupBattlerAtByATB = function() {
    var battlers = $gameParty.members();
    var notFilled = true;
    while(notFilled) {
        for (var i = 0; i < battlers.length; i++) {
            battlers[i].updateATB(1);
            if (battlers[i]._at > BattleManager.maxAt() * 0.8) notFilled = false;
        }
    }
    for (var i = 0; i < battlers.length; i++) {
        if (battlers[i].isStateAffected(134)) battlers[i].setAt(1);
    }
};

//254
BattleManager.selectNextCommand = function() {
    var actionState = this.getLastActorActionState();
    var members = $gameParty.battleMembers();
    for (var i = 1; i < members.length; i++) {
        var n = (this._actorIndex + i).mod(members.length);
        var actor = members[n];
        if (actor.isStandby() && actor.canInput()) {
            return this.changeActor(n, actionState);
        }
    }
    return this.changeActor(-1, actionState);
};

//266
BattleManager.selectPreviousCommand = function() {
    var actionState = this.getLastActorActionState();
    var members = $gameParty.battleMembers();
    for (var i = 1; i < members.length; i++) {
        var n = (this._actorIndex - i).mod(members.length);
        var actor = members[n];
        if (actor.isStandby() && actor.canInput()) {
            return this.changeActor(n, actionState);
        }
    }
    return this.changeActor(-1, actionState);
};

BattleManager.getLastActorActionState = function() {
    var actor = this.actor();
    return (actor && actor.isStandby() ? 'undecided' : 'waiting');
};

//277
BattleManager.refreshStatus = function() {
    this._refreshHandler();
};

//281
BattleManager.startTurn = function() {
    //this._phase = 'turn';
    //this.clearActor();
    //$gameTroop.increaseTurn();
    //this.makeActionOrders();
    $gameParty.requestMotionRefresh();
    this._logWindow.startTurn();
};

//290
// 特殊行動がある時はそちらを優先
BattleManager.updateTurn = function() {
    if (this._waitAnim > 0) this._waitAnim--;
    if (this._waitAnim <= 0) {
        // 予言などで残存ログがある場合消す
        if (this._remainingLog) {
            this._remainingLog = false;
            this._logWindow.clear();
        }
        $gameParty.requestMotionRefresh();
        if (this._specialSkills.length > 0) {
			this._special = this._specialSkills.shift();
			var oracleSkill = $dataSkills[this._special['skillId']];
            var targets = this._special['targets'];
            
			// 予言で実行している場合のみ技名を出す
			if (this._special['origin'] === 'prophecy') {
				this._remainingLog = true;
				this._logWindow.addItemNameText($dataSkills[this._special['skillId']].name);
            }
            
			this._logWindow.showNormalAnimation(targets, oracleSkill.animationId);
			this._phase = 'specialDamage';
		} else {
            if (!this._subject) {
                this._subject = this.getNextSubject();
                if (this._subject) {
                    this._subject.onTurnEnd();
                    this.refreshStatus();
                    this._logWindow.displayAutoAffectedStatus(this._subject);
                    this._logWindow.displayRegeneration(this._subject);
                    if (this._logWindow.isBusy()) return;
                }
            }
            if (this._subject) {
                this.processTurn();
            } else {
                this.endTurn();
            }
        }
    }
};

//302
BattleManager.processTurn = function() {
    var subject = this._subject;
    var action = subject.currentAction();
    if (action) {
        if (action.isValid()) {
            this._phase = 'action';
            this.startAction();
        }
        subject.removeCurrentAction();
    } else {
        $gameTroop.increaseTurn();
        if (subject._isCounter) subject._isCounter = false;
        else {
            subject.resetAt(this._action ? this._action.item() : null);
            subject.onAllActionsEnd();
        }
        this.refreshStatus();
        this._logWindow.displayAutoAffectedStatus(subject);
        this._logWindow.displayCurrentState(subject);
        this._logWindow.displayRegeneration(subject);
        this.endTurn();
    }
};

//321
var turnLength = 6000;
var letterSet = ['０','１','２','３','４','５','６','７','８'];
BattleManager.endTurn = function() {
    this._phase = 'turnEnd';
    this._subject = null;
    if (!this.isAtbWait()) {
        this._turnCount = (this._turnCount + 1) % turnLength;
        this.allBattleMembers().forEach(function(battler) {
            battler.regenerateAll();
            battler.updateStateTurns();
            battler.updateBuffTurns();
            battler.removeStatesAuto(2);
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(battler);
            this._logWindow.displayRegeneration(battler);
        }, this);
        // 予言カウントダウン処理
        if (this._prophecy && this._prophecy['checkTurn'] === this._turnCount % 8) {
            if (--this._prophecy['count'] === 0) {
                if (this._prophecy['skillId'] < 256 || this._prophecy['skillId'] === 263) var target = $gameParty.members();
                else if (this._prophecy['skillId'] < 259) var target = $gameTroop.members();
                else var target = $gameParty.members().concat($gameTroop.members());
                this._specialSkills.push({
                    skillId		:	this._prophecy['skillId'],
                    targets 	:	target,
                    origin 		:	'prophecy'
                });
                this._prophecyRate = this._prophecy['rate'];
                this._prophecy = null;
            } else {
                this._logWindow.addItemNameText("「" + $dataSkills[this._prophecy['skillId']].name + "」まで　あと" + letterSet[this._prophecy['count']]);
                this._remainingLog = true;
				this._waitAnim += 60;
            }
        }
    }
};

//340
BattleManager.updateTurnEnd = function() {
    if (!this._escaping || !$gameParty.canEscape() || !this.processEscape()) {
        this._phase = 'turn';
        this.startTurn();
    }
};

//344
Alias.BaMa_getNextSubject = BattleManager.getNextSubject;
BattleManager.getNextSubject = function() {
    if (this.isAtbWait() || this._logWindow.isBusy()) {
        return null;
    } else {
        return Alias.BaMa_getNextSubject.apply(this, arguments);
    }
};

//466
Alias.BaMa_processForcedAction = BattleManager.processForcedAction;
BattleManager.processForcedAction = function() {
    if (this._subject) {
        var subject = this._subject;
        $gameTroop.increaseTurn();
        subject.onAllActionsEnd();
        subject.resetAt(this._action ? this._action.item() : null);
        this.refreshStatus();
        this._logWindow.displayAutoAffectedStatus(subject);
        this._logWindow.displayCurrentState(subject);
        this._logWindow.displayRegeneration(subject);
        this._subject = null;
    }
    Alias.BaMa_processForcedAction.apply(this, arguments);
};

//515
BattleManager.processEscape = function() {
    $gameParty.performEscape();
    SoundManager.playEscape();
    this._escaped = true;
    this.processAbort();
    return true;
};

BattleManager.increaseEscapeRate = function() {
    this._escapeRatio += 0.1;
};

//550
Alias.BaMa_endBattle = BattleManager.endBattle;
BattleManager.endBattle = function(result) {
    // 予言などで残存ログがある場合消す
    if (this._remainingLog) {
        this._remainingLog = false;
        this._logWindow.clear();
    }
    Alias.BaMa_endBattle.apply(this, arguments);
    this.clearActor();
};

//-----------------------------------------------------------------------------
// Game_BattlerBase

//110
Alias.GaBa_initMembers = Game_BattlerBase.prototype.initMembers;
Game_BattlerBase.prototype.initMembers = function() {
    Alias.GaBa_initMembers.apply(this, arguments);
    this.resetBattleParam();
    this._at = 0;
    this._turn = 1;
};

//235
Alias.GaBa_die = Game_BattlerBase.prototype.die;
Game_BattlerBase.prototype.die = function() {
    Alias.GaBa_die.apply(this, arguments);
    if (MPPlugin.resetAtDie) {
        this._at = 0;
    } else {
        this._at = Math.min(this._at, BattleManager.maxAt() - 1);
    }
    if ($gameParty.inBattle()) {
        this._ct = 0;
        this._maxCt = 0;
        this._decided = 0;
    }
};

Game_BattlerBase.prototype.onMadeAction = function() {
    this.setDecided(1);
    this._turn++;
    this._ct = 0;
    this._maxCt = 0;
    var action = this.currentAction();
    if (action) {
        var item = action.item();
        if (item) {
            var rate = (MppOptions.atbSpeed - 7) * 3;
            this._maxCt = BattleManager.isUnderQuick() ? 0 : Math.max(item.speed * rate, 0);
        }
    }
};

// SubSkillに対してonMadeActionを呼ぶと起点のアクションを見てCTを決めてしまうし、起点アクションをこのタイミングで消すわけにもいかないので別途作った
Game_BattlerBase.prototype.onMadeActionSubSkill = function(secondAction) {
    this.setDecided(1);
    this._ct = 0;
    this._maxCt = 0;
    if (secondAction) {
        var item = secondAction.item();
        if (item) {
            var rate = (MppOptions.atbSpeed - 7) * 3;
            this._maxCt = BattleManager.isUnderQuick() ? 0 : Math.max(item.speed * rate, 0);
        }
    }
};

Game_BattlerBase.prototype.setDecided = function(decided) {
    this._decided = decided;
};

Game_BattlerBase.prototype.setAt = function(value) {
    this._at = Math.floor(BattleManager.maxAt() * value);
    this._at = this._at.clamp(0, BattleManager.maxAt() - 1);
};

Game_BattlerBase.prototype.atRate = function() {
    return this._at / BattleManager.maxAt();
};

Game_BattlerBase.prototype.castRate = function() {
    if (this._maxCt > 0) {
        return this._ct / this._maxCt;
    } else {
        return -1;
    }
};

Game_BattlerBase.prototype.isStandby = function() {
    return this._decided === 0 && this.atRate() === 1;
};

Game_BattlerBase.prototype.decided = function() {
    return this._decided;
};

Game_BattlerBase.prototype.isMadeAction = function() {
    return this._decided === 1 && this._ct === this._maxCt;
};

//-----------------------------------------------------------------------------
// Game_Battler

//59
Alias.GaBa_requestMotion = Game_Battler.prototype.requestMotion;
Game_Battler.prototype.requestMotion = function(motionType) {
    Alias.GaBa_requestMotion.apply(this, arguments);
    this._motionRefresh = false;
};

//144
Alias.GaBa_clearActions = Game_Battler.prototype.clearActions;
Game_Battler.prototype.clearActions = function() {
    Alias.GaBa_clearActions.apply(this, arguments);
    this._ct = 0;
    this._maxCt = 0;
};

Game_Battler.prototype.setAt = function(value) {
    if (this.atRate() === 1 && value >= 1) return;
    Game_BattlerBase.prototype.setAt.call(this, value);
    if (this._decided > 0 && this.atRate() < 1) {
        this.setDecided(0);
        this.clearActions();
        BattleManager.deleteDeactiveBattler();
    }
};

Game_Battler.prototype.forceResetAt = function() {
    Game_BattlerBase.prototype.setAt.call(this, 0);
    if (this._decided > 0 && this.atRate() < 1) {
        this.setDecided(0);
        this.clearActions();
        BattleManager.deleteDeactiveBattler();
    }
};

Game_Battler.prototype.gainAt = function(value) {
    this.setAt(this.atRate() + value);
};

Game_Battler.prototype.resetAt = function(item) {
    this.setAt(0);
};

//419
Alias.GaBa_onBattleStart = Game_Battler.prototype.onBattleStart;
Game_Battler.prototype.onBattleStart = function() {
    Alias.GaBa_onBattleStart.apply(this, arguments);
    this.resetBattleParam();
    this._at = 0;
    this._ct = 0;
    this._maxCt = 0;
    this._turnCount = 0;
    this._decided = 0;
};

//427
// ステータスのデバフは時間で消さない
// Alias.GaBa_onAllActionsEnd = Game_Battler.prototype.onAllActionsEnd;
Game_Battler.prototype.onAllActionsEnd = function() {
    if (!this._isCounter) {
        this.clearResult();
        this.removeStatesAuto(1);
        // this.removeBuffsAuto();
        this._turnCount++;
        this._ct = 0;
        this._maxCt = 0;
        this.setDecided(0);
        this.setActionState('undecided');
    }
};

//433
Alias.GaBa_onTurnEnd = Game_Battler.prototype.onTurnEnd;
Game_Battler.prototype.onTurnEnd = function() {
    if ($gameParty.inBattle()) {
        // this.clearResult();
        // this.regenerateAll();
        // this.updateStateTurns();
        // this.updateBuffTurns();
        // this.removeStatesAuto(2);
    } else {
        Alias.GaBa_onTurnEnd.apply(this, arguments);
    }
};

//443
Alias.GaBa_onBattleEnd = Game_Battler.prototype.onBattleEnd;
Game_Battler.prototype.onBattleEnd = function() {
    Alias.GaBa_onBattleEnd.apply(this, arguments);
    this.resetBattleParam();
    delete this._ct;
    delete this._maxCt;
    delete this._turnCount;
    delete this._decided;
};

Game_Battler.prototype.canEscape = function() {
    return this.atRate() >= BattleManager.needEscapeAt();
};

Game_Battler.prototype.escapeFailure = function() {
    if (this.atRate() === 1 && BattleManager.escapeAtCost() > 0) {
        this.clearActions();
    }
    this.gainAt(-BattleManager.escapeAtCost());
};

Game_Battler.prototype.updateATB = function(rate) {
    if (!this.isAlive()) return false;
    if (this._at < BattleManager.maxAt()) {
        this._at += (this.agi + MPPlugin.atIncrement - 1) * rate * 2.5;
        if(this._at >= BattleManager.maxAt()) {
            this._at = BattleManager.maxAt();
            this.makeActions();
            return true;
        }
    } else if (this._ct < this._maxCt) {
        this._ct = Math.min(this._ct + rate, this._maxCt);
    }
    return false;
};

Game_Battler.prototype.isChantingGauge = function() {
    return MPPlugin.chantingView && this.castRate() >= 0;
};

Game_Battler.prototype.isEscapingGauge = function() {
    return MPPlugin.EscapingChange && BattleManager.isEscaping() && this.isAlive();
};

Game_Battler.prototype.atGaugeRate = function() {
    return (this.isChantingGauge() ? this.castRate() : this.atRate());
};

Game_Battler.prototype.atGaugeColor1 = function() {
    var color = this.atGaugeColorEx1();
    if (color) return color;
    return (this.atRate() < 1 ? MPPlugin.atChargeColor1 : MPPlugin.atMaxColor1);
};

Game_Battler.prototype.atGaugeColor2 = function() {
    var color = this.atGaugeColorEx2();
    if (color) return color;
    return (this.atRate() < 1 ? MPPlugin.atChargeColor2 : MPPlugin.atMaxColor2);
};

Game_Battler.prototype.atGaugeColorEx1 = function() {
    if (this.isChantingGauge()) return MPPlugin.atChantingColor1;
    if (this.isEscapingGauge()) return MPPlugin.atEscapingColor1;
    return null;
};

Game_Battler.prototype.atGaugeColorEx2 = function() {
    if (this.isChantingGauge()) return MPPlugin.atChantingColor2;
    if (this.isEscapingGauge()) return MPPlugin.atEscapingColor2;
    return null;
};

//-----------------------------------------------------------------------------
// Game_Actor

if (Game_Actor.prototype.hasOwnProperty('onRestrict')) {
    Alias.GaAc_onRestrict = Game_Actor.prototype.onRestrict;
}
Game_Actor.prototype.onRestrict = function() {
    var _super = Alias.GaAc_onRestrict || Game_Battler.prototype.onRestrict;
    _super.apply(this, arguments);
    if ($gameParty.inBattle() && !this._active && this.isAlive() &&
            this.atRate() === 1) {
        this._at -= 0.001;
    }
};

//689
Alias.GaAc_performVictory = Game_Actor.prototype.performVictory;
Game_Actor.prototype.performVictory = function() {
    Alias.GaAc_performVictory.apply(this, arguments);
    this.setDecided(0);
};

//714
Alias.GaAc_makeAutoBattleActions = Game_Actor.prototype.makeAutoBattleActions;
Game_Actor.prototype.makeAutoBattleActions = function() {
    Alias.GaAc_makeAutoBattleActions.apply(this, arguments);
    this.onMadeAction();
};

//729
Alias.GaAc_makeConfusionActions = Game_Actor.prototype.makeConfusionActions;
Game_Actor.prototype.makeConfusionActions = function() {
    Alias.GaAc_makeConfusionActions.apply(this, arguments);
    this.onMadeAction();
};

//736
Alias.GaAc_makeActions = Game_Actor.prototype.makeActions;
Game_Actor.prototype.makeActions = function() {
    Alias.GaAc_makeActions.apply(this, arguments);
    if (!this.canInput()) {
        this.onMadeAction();
        MPPATB_Variable.commandPause -= MPPlugin.StopFrame;
        if(MPPATB_Variable.commandPause < 0) MPPATB_Variable.commandPause = 0;
    }
};

//-----------------------------------------------------------------------------
// Game_Enemy

//214
Game_Enemy.prototype.meetsTurnCondition = function(param1, param2) {
    var n = this._turnCount;
    if (param2 === 0) {
        return n === param1;
    } else {
        return n >= param1 && n % param2 === param1 % param2;
    }
};

//278
Alias.GaEn_makeActions = Game_Enemy.prototype.makeActions;
Game_Enemy.prototype.makeActions = function() {
    Alias.GaEn_makeActions.apply(this, arguments);
    this.onMadeAction();
};

Game_Enemy.prototype.isEscapingGauge = function() {
    return false;
};

//-----------------------------------------------------------------------------
// Game_Unit

Game_Unit.prototype.selectAll = function() {
    this.members().forEach( member => member.select() );
};

Game_Unit.prototype.select = function(activeMember) {
    this.members().forEach( member =>
        member === activeMember ? member.select() : member.deselect() );
};

//-----------------------------------------------------------------------------
// Game_Party

Game_Party.prototype.canEscape = function() {
    return this.aliveMembers().every( member => member.canEscape() );
};

Game_Party.prototype.escapeFailure = function() {
    this.aliveMembers().forEach( member => member.escapeFailure() );
    BattleManager.deleteDeactiveBattler();
};

//179
Alias.GaPa_addActor = Game_Party.prototype.addActor;
Game_Party.prototype.addActor = function(actorId) {
    Alias.GaPa_addActor.apply(this, arguments);
    if (this.inBattle())
        BattleManager.refreshStatus();
};

//187
Alias.GaPa_removeActor = Game_Party.prototype.removeActor;
Game_Party.prototype.removeActor = function(actorId) {
    Alias.GaPa_removeActor.apply(this, arguments);
    if (this.inBattle())
        BattleManager.refreshStatus();
};

//-----------------------------------------------------------------------------
// Game_Troop

//152
/* おそらく逃走ATBが必要な場合の逃走中にイベントが走ったらキャンセルする処理、即逃げするので要らない
Alias.GaTr_setupBattleEvent = Game_Troop.prototype.setupBattleEvent;
Game_Troop.prototype.setupBattleEvent = function() {
    var lastRunning = this._interpreter.isRunning();
    Alias.GaTr_setupBattleEvent.apply(this, arguments);
    if (!lastRunning && this._interpreter.isRunning()) {
        BattleManager.setEscaping(false);
    }
};
*/

//-----------------------------------------------------------------------------
// Window_BattleLog

//121
Alias.WiBaLo_isFastForward = Window_BattleLog.prototype.isFastForward;
Window_BattleLog.prototype.isFastForward = function() {
    return MPPlugin.fastLogEneble && Alias.WiBaLo_isFastForward.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Window_PartyCommand

Window_PartyCommand.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, (Graphics.boxWidth - this.windowWidth()) / 2, (Graphics.boxHeight - this.windowHeight() - 100) / 2);
    this.openness = 0;
    this.deactivate();
};

Window_PartyCommand.prototype.windowWidth = function() {
    return 180;
};

Window_PartyCommand.prototype.windowHeight = function() {
    return this.fittingHeight(2);
};

Window_PartyCommand.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    var maxCols = this.maxCols();
    rect.width = this.itemWidth();
    rect.height = this.itemHeight();
    rect.x = index % maxCols * (rect.width + this.spacing()) - this._scrollX;
    rect.y = Math.floor(index / maxCols) * rect.height - this._scrollY + this.lineHeight();
    return rect;
};

Window_PartyCommand.prototype.setup = function() {
    this.clearCommandList();
    this.makeCommandList();
    this.refresh();
    this.select(0);
    this.drawTextEx('- PAUSE -', this.textPadding(), 0);
    this.activate();
    this.open();
};

Window_PartyCommand.prototype.itemTextAlign = function() {
    return 'center';
};

//28
Window_PartyCommand.prototype.makeCommandList = function() {
    this.addCommand(TextManager.escape, 'escape', BattleManager.canEscape());
    if (MPPlugin.ChangeModeInBattle) {
        var mode = BattleManager.atbMode();
        var name = "[" + MPPlugin.atbModeTexts[mode] + "]";
        this.addCommand(name, 'atbMode');
    }
};

//-----------------------------------------------------------------------------
// Window_ActorCommand

// 左端に敵名表示のため左に寄せる
Window_ActorCommand.prototype.initialize = function() {
    var y = Graphics.boxHeight - this.windowHeight();
    Window_Command.prototype.initialize.call(this, 108, y);
    this.openness = 0;
    this.deactivate();
    this._actor = null;
};

// tabで説明欄の表示/非表示切り替え
Alias.WiAcCo_processCursorMove = Window_ActorCommand.prototype.processCursorMove;
Window_ActorCommand.prototype.processCursorMove = function() {
    Alias.WiAcCo_processCursorMove.call(this);
    if (this.isCursorMovable()) {
        if (Input.isTriggered('tab')) {
            BattleManager._showHelp = !BattleManager._showHelp;
            this.showHelpWindow();
        } else if (Input.isTriggered('right')) {
            this.callHandler('sub');
        }
    }
};

Window_ActorCommand.prototype.showHelpWindow = function() {
    if (this._helpWindow && BattleManager._showHelp) {
        this._helpWindow.open();
    } else {
        this._helpWindow.close();
    }
};

Alias.WiAcCo_setup = Window_ActorCommand.prototype.setup;
Window_ActorCommand.prototype.setup = function(actor) {
    Alias.WiAcCo_setup.call(this, actor);
    this._helpWindow.show();
};

//-----------------------------------------------------------------------------
// Window_BattleStatus

//13
Alias.WiBaSt_initialize = Window_BattleStatus.prototype.initialize;
Window_BattleStatus.prototype.initialize = function() {
    this._createDrawer = false;
    Alias.WiBaSt_initialize.apply(this, arguments);
};

// 敵名表示ウィンドウの分小さくする
Window_BattleStatus.prototype.windowWidth = function() {
    return Graphics.boxWidth - 300;
};

Window_BattleStatus.prototype.setActorCmdWindow = function(actorCmdWindow) {
    this._actorCmdWindow = actorCmdWindow;
};

Window_BattleStatus.prototype.isActorCmdEnabled = function() {
    var window = this._actorCmdWindow;
    return window && (window.active || !window.isOpen());
};

Window_BattleStatus.prototype.processHandling = function() {
    if (this.isOpen() && this.isActorCmdEnabled()) {
        if (this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
            this.processPagedown();
        } else if (this.isHandled('pageup') && Input.isTriggered('pageup')) {
            this.processPageup();
        }
    }
};

Window_BattleStatus.prototype.processTouch = function() {
    if (this.isOpen() && this.isActorCmdEnabled()) {
        if (TouchInput.isTriggered() && this.isTouchedInsideFrame()) {
            this._touching = true;
            this.updateInputData();
        }
        if (this._touching) {
            if (TouchInput.isPressed()) {
                this.onTouch(false);
            } else {
                if (this.isTouchedInsideFrame()) {
                    this.onTouch(true);
                }
                this._touching = false;
            }
        }
    }
};

Window_BattleStatus.prototype.onTouch = function(triggered) {
    var lastTopRow = this.topRow();
    var x = this.canvasToLocalX(TouchInput.x);
    var y = this.canvasToLocalY(TouchInput.y);
    var hitIndex = this.hitTest(x, y);
    if (hitIndex >= 0) {
        if (triggered && this.isTouchOkEnabled()) {
            var actor = $gameParty.battleMembers()[hitIndex];
            if (actor && actor.isStandby()) {
                this.select(hitIndex);
                this.processOk();
            }
        }
    } else if (this._stayCount >= 10) {
        if (y < this.padding) {
            this.scrollUp();
        } else if (y >= this.height - this.padding) {
            this.scrollDown();
        }
    }
    if (this.topRow() !== lastTopRow) {
        SoundManager.playCursor();
    }
};

Window_BattleStatus.prototype.processOk = function() {
    this.updateInputData();
    this.deactivate();
    this.callOkHandler();
};

Window_BattleStatus.prototype.processPageup = function() {
    this.updateInputData();
    this.deactivate();
    this.callHandler('pageup');
};

Window_BattleStatus.prototype.processPagedown = function() {
    this.updateInputData();
    this.deactivate();
    this.callHandler('pagedown');
};

Window_BattleStatus.prototype.isCursorMovable = function() {
    return false;
};

Window_BattleStatus.prototype.isDrawAt = function() {
    return MPPlugin.atGaugeWidth > 0;
};

//39
Alias.WiBaSt_refresh = Window_BattleStatus.prototype.refresh;
Window_BattleStatus.prototype.refresh = function() {
    this.clearUpdateDrawer();
    this._createDrawer = true;
    Alias.WiBaSt_refresh.apply(this, arguments);
    this._createDrawer = false;
};

Window_BattleStatus.prototype.drawBasicArea = function(rect, actor) {
    this.drawActorName(actor, rect.x + 0, rect.y, rect.width);
};

//63
Alias.WiBaSt_gaugeAreaWidth = Window_BattleStatus.prototype.gaugeAreaWidth;
Window_BattleStatus.prototype.gaugeAreaWidth = function() {
    if (this.isDrawAt()) {
        return 234 + MPPlugin.atGaugeWidth;
    } else {
        return Alias.WiBaSt_gaugeAreaWidth.apply(this, arguments);
    }
};

//80
Alias.WiBaSt_drawGaugeAreaWithTp = Window_BattleStatus.prototype.drawGaugeAreaWithTp;
Window_BattleStatus.prototype.drawGaugeAreaWithTp = function(rect, actor) {
    if (this.isDrawAt()) {
        this.drawActorHp(actor, rect.x + 0, rect.y, 108);
        this.drawActorMpTp(actor, rect.x + 123, rect.y, 96);
        this.drawActorAt(actor, rect.x + 234, rect.y, MPPlugin.atGaugeWidth);
    } else {
        Alias.WiBaSt_drawGaugeAreaWithTp.apply(this, arguments);
    }
};

//86
Alias.WiBaSt_drawGaugeAreaWithoutTp = Window_BattleStatus.prototype.drawGaugeAreaWithoutTp;
Window_BattleStatus.prototype.drawGaugeAreaWithoutTp = function(rect, actor) {
    if (this.isDrawAt()) {
        this.drawActorHp(actor, rect.x + 0, rect.y, 108);
        this.drawActorMp(actor, rect.x + 123, rect.y, 96);
        this.drawActorAt(actor, rect.x + 234, rect.y, MPPlugin.atGaugeWidth);
    } else {
        Alias.WiBaSt_drawGaugeAreaWithoutTp.apply(this, arguments);
    }
};

Window_BattleStatus.prototype.drawActorMpTp = function(actor, x, y, width) {
    width = (width || 186) - 10;
    this.drawGauge(x + 10, y, width, actor.tpRate(),
                   this.tpGaugeColor1(), this.tpGaugeColor2());
    this.drawGauge(x, y - 8, width, actor.mpRate(),
                   this.mpGaugeColor1(), this.mpGaugeColor2());
    this.contents.fontSize = 24;
    this.changeTextColor(this.systemColor());
    this.contents.drawText(TextManager.mpA, x, y + 1, 32, 24);
    this.contents.drawText(TextManager.tpA, x + 22, y + 10, 32, 24);
    this.contents.fontSize = this.standardFontSize();
};

Window_BattleStatus.prototype.drawActorAt = function(actor, x, y, width) {
    width = width || 60;
    var color1 = actor.atGaugeColor1();
    var color2 = actor.atGaugeColor2();
    this.drawAtGauge(x, y, width, actor.atGaugeRate(), color1, color2);
    this.changeTextColor(this.systemColor());
    this.drawText(MPPlugin.atGaugeName, x, y, 44);
    
    if (this._createDrawer) {
        this.createActorAtDrawer(actor, x, y, width);
    }
};

Window_BattleStatus.prototype.drawAtGauge = function(x, y, width, rate, color1, color2) {
    var height = MPPlugin.atGaugeHeight;
    var fillW = width * rate;
    var gaugeY = y + this.lineHeight() - height - 2;
    this.contents.fillRect(x, gaugeY, width, height, this.gaugeBackColor());
    this.contents.gradientFillRect(x, gaugeY, fillW, height, color1, color2);
};

Window_BattleStatus.prototype.createActorAtDrawer = function(actor, x, y, width) {
    this.addUpdateDrawer(() => {
        if (Graphics.frameCount % 2 === 0) {
            this.contents.clearRect(x, y, width, this.lineHeight());
            this.drawActorAt(actor, x, y, width);
        }
        return true;
    });
};

//-----------------------------------------------------------------------------
// Window_BattleActor

Window_BattleActor.prototype.processHandling = 
    Window_Selectable.prototype.processHandling;

Window_BattleActor.prototype.processTouch =
    Window_Selectable.prototype.processTouch;

Window_BattleActor.prototype.onTouch =
    Window_Selectable.prototype.onTouch;

Window_BattleActor.prototype.processOk =
    Window_Selectable.prototype.processOk;

Window_BattleActor.prototype.isCursorMovable = 
    Window_Selectable.prototype.isCursorMovable;

Window_BattleActor.prototype.isDrawAt = function() {
    return true;
};

Window_BattleActor.prototype.selectForItem = function() {
    var actor = BattleManager.actor();
    var action = actor.inputtingAction();
    this.setCursorFixed(false);
    this.setCursorAll(false);
    if (action.isForUser()) {
        this.setCursorFixed(true);
        this.select(actor.index());
    } else if (action.isForAll()) {
        this.setCursorAll(true);
        this.select(0);
    } else {
        this.select(0);
    }
};

//31
Alias.WiBaAc_select = Window_BattleActor.prototype.select;
Window_BattleActor.prototype.select = function(index) {
    Alias.WiBaAc_select.apply(this, arguments);
    if (this._cursorAll) $gameParty.selectAll();
};

if (Window_BattleActor.prototype.hasOwnProperty('hitTest')) {
    Alias.WiBaAc_hitTest = Window_BattleActor.prototype.hitTest;
}
Window_BattleActor.prototype.hitTest = function(x, y) {
    var _super = Alias.WiBaAc_hitTest || Window_BattleStatus.prototype.hitTest;
    var result = _super.apply(this, arguments);
    if (result >= 0 && this._cursorAll && this.isContentsArea(x, y)) {
        return 0;
    }
    return result;
};

Window_BattleActor.prototype.autoSelect = function() {
    var action = BattleManager.inputtingAction();
    if (!action) return;
    this._inputLock = false;
    this._selectDead = false;
    this.setCursorAll(false);
    if (action.isForUser()) {
      this.select(BattleManager.actor().index());
      this._inputLock = true;
    } else if (action.isForAll()) {
      this._inputLock = true;
      this.setCursorAll(true);
    } else if (action.isForDeadFriend()) {
      this._selectDead = true;
      this.autoSelectFirstDeadActor();
    }
    this.updateCursor();
};

Window_BattleActor.prototype.updateCursor = function() {
    if (this._cursorAll) {
        var allRowsHeight = this.maxRows() * this.itemHeight();
        this.setCursorRect(0, 0, this.contents.width, allRowsHeight);
        this.setTopRow(0);
    } else if (this.isCursorVisible()) {
        var rect = this.itemRect(this.index());
        this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
    } else {
        this.setCursorRect(0, 0, 0, 0);
    }
};

Window_BattleActor.prototype.autoSelectFirstDeadActor = function() {
    var length = $gameParty.members().length;
    for (var i = 0; i < length; ++i) {
      var member = $gameParty.members()[i];
      if (member && member.isDead()) return this.select(i);
    }
};

Window_BattleActor.prototype.isOkEnabled = function() {
    if (this._selectDead) return this.actor().isDead();
    return Window_Selectable.prototype.isOkEnabled.call(this);
};

Window_BattleActor.prototype.updateHelp = function() {
    if (!this._helpWindow) return;
    this._helpWindow.setBattler(this.actor());
};

Alias.WiBaEn_processTouch =
    Window_BattleActor.prototype.processTouch;
Window_BattleActor.prototype.processTouch = function() {
    if (this.isOpenAndActive()) {
      if (TouchInput.isTriggered() && !this.isTouchedInsideFrame()) {
        if (this.getClickedActor() >= 0) {
          var index = this.getClickedActor();
          if (this.index() === index) {
            return this.processOk();
          } else {
            SoundManager.playCursor();
            return this.select(index);
          }
        }
      }
      if (TouchInput.isPressed() && !this.isTouchedInsideFrame()) {
        if (this.getClickedActor() >= 0) {
          var index = this.getClickedActor();
          if (this.index() !== index) {
            SoundManager.playCursor();
            return this.select(index);
          }
        }
      }
    var index = this.getMouseOverActor();
        if (index >= 0 && this.index() !== index) {
          SoundManager.playCursor();
          return this.select(index);
        }
    }
    Alias.WiBaEn_processTouch.call(this);
};

Window_BattleActor.prototype.getClickedActor = function() {
    for (var i = 0; i < $gameParty.battleMembers().length; ++i) {
      var actor = $gameParty.battleMembers().reverse()[i];
      if (!actor) continue;
      if (this.isClickedActor(actor)) {
        if (this._selectDead && !actor.isDead()) continue;
        if (this._inputLock && actor.index() !== this.index()) continue;
        return actor.index();
      }
    }
    return -1;
};

Window_BattleActor.prototype.isClickedActor = function(actor) {
    if (!actor) return false;
    if (!actor.isSpriteVisible()) return false;
    if (!actor.isAppeared()) return false;
    if ($gameTemp._disableMouseOverSelect) return false;
    var x = TouchInput.x;
    var y = TouchInput.y;
    var rect = new Rectangle();
    rect.width = actor.spriteWidth();
    rect.height = actor.spriteHeight();
    rect.x = actor.spritePosX() - rect.width / 2;
    rect.y = actor.spritePosY() - rect.height;
    return (x >= rect.x && y >= rect.y && x < rect.x + rect.width &&
      y < rect.y + rect.height);
};

Window_BattleActor.prototype.getMouseOverActor = function() {
    for (var i = 0; i < $gameParty.battleMembers().length; ++i) {
      var actor = $gameParty.battleMembers().reverse()[i];
      if (!actor) continue;
      if (this.isMouseOverActor(actor)) {
        if (this._selectDead && !actor.isDead()) continue;
        if (this._inputLock && actor.index() !== this.index()) continue;
        return actor.index();
      }
    }
    return -1;
};

Window_BattleActor.prototype.isMouseOverActor = function(actor) {
    if (!actor) return false;
    if (!actor.isSpriteVisible()) return false;
    if (!actor.isAppeared()) return false;
    if ($gameTemp._disableMouseOverSelect) return false;
    var x = TouchInput._mouseOverX;
    var y = TouchInput._mouseOverY;
    var rect = new Rectangle();
    rect.width = actor.spriteWidth();
    rect.height = actor.spriteHeight();
    rect.x = actor.spritePosX() - rect.width / 2;
    rect.y = actor.spritePosY() - rect.height;
    return (x >= rect.x && y >= rect.y && x < rect.x + rect.width &&
      y < rect.y + rect.height);
};

//-----------------------------------------------------------------------------
// Window_BattleEnemy

Window_BattleEnemy.prototype.isCurrentItemEnabled = function() {
    return !!this.enemy();
};

//58
Window_BattleEnemy.prototype.show = function() {
    this.refresh();
    this.select(0);
    Window_Selectable.prototype.show.call(this);
};

Window_BattleEnemy.prototype.selectForItem = function() {
    var actor = BattleManager.actor();
    var action = actor.inputtingAction();
    this.setCursorAll(false);
    if (action.isForAll())
        this.setCursorAll(true);
    // 敵選択時、x座標が一番大きい敵から選ぶ
    var index = 0;
    var posX = 0;
    var enemies = $gameTroop.aliveMembers();
    for (var i = 0; i < enemies.length; i++){
        if (enemies[i].spritePosX() > posX) {
            posX = enemies[i].spritePosX();
            index = i;
        }
    }
    this.select(index);
};

if (Window_BattleEnemy.prototype.hasOwnProperty('hitTest')) {
    Alias.WiBaEn_hitTest = Window_BattleEnemy.prototype.hitTest;
}
Window_BattleEnemy.prototype.hitTest = function(x, y) {
    var _super = Alias.WiBaEn_hitTest || Window_Selectable.prototype.hitTest;
    var result = _super.apply(this, arguments);
    if (result >= 0 && this._cursorAll && this.isContentsArea(x, y)) {
        return 0;
    }
    return result;
};

//69
Alias.WiBaEn_refresh = Window_BattleEnemy.prototype.refresh;
Window_BattleEnemy.prototype.refresh = function() {
    this._enemies = this.allowedTargets();
    this.sortTargets();
    Window_Selectable.prototype.refresh.call(this);
    if (this.index() >= 0)
        this.select(this._index.clamp(0, this.maxItems() - 1));
};

//74
Alias.WiBaEn_select = Window_BattleEnemy.prototype.select;
Window_BattleEnemy.prototype.select = function(index) {
    Alias.WiBaEn_select.apply(this, arguments);
    if (this._cursorAll) $gameTroop.selectAll();
};

Alias.WiBaEn_initialize =
    Window_BattleEnemy.prototype.initialize;
Window_BattleEnemy.prototype.initialize = function(x, y) {
    x -= Graphics.boxWidth * 200;
    y -= Graphics.boxHeight * 200;
    Alias.WiBaEn_initialize.call(this, x, y);
};

Alias.WindowLayer_webglMaskWindow =
    WindowLayer.prototype._webglMaskWindow;
WindowLayer.prototype._webglMaskWindow = function(renderSession, win) {
    if (win._ignoreMask) return;
    Alias.WindowLayer_webglMaskWindow.call(this, renderSession, win);
};

Alias.WiBaEn_maxCols =
    Window_BattleEnemy.prototype.maxCols;
Window_BattleEnemy.prototype.maxCols = function() {
    return Math.max(this._enemies.length, 2);
};

Window_BattleEnemy.prototype.allowedTargets = function() {
    var targets = [];
    targets = targets.concat($gameTroop.aliveMembers());
    return targets;
};

Window_BattleEnemy.prototype.sortTargets = function() {
    // 【追加】どうせ順序が必要な部分は全く異なる処理にしたので消去
    /*
    this._enemies.sort(function(a, b) {
        if (a.spritePosX() === b.spritePosX()) {
          return a.spritePosY() - b.spritePosY();
        }
        return a.spritePosX() - b.spritePosX();
    });
    */
};

// 描画を基準にターゲットを移動するよう変更
Window_BattleEnemy.prototype.cursorDown = function(wrap) {
    var index = this.index();
    var diff = 9999;
    var target = -1;
    for (var i = 0; i < this._enemies.length; i++) {
        if (i != index){
            var diffX = Math.abs(this._enemies[index].spritePosX() - this._enemies[i].spritePosX());
            var diffY = this._enemies[i].spritePosY() - this._enemies[index].spritePosY();
            if (diffY > diffX && diffY < diff)  {
                diff = diffY;
                target = i
            }
        } 
    }
    if (target >= 0) this.select(target);
};

Window_BattleEnemy.prototype.cursorUp = function(wrap) {
    var index = this.index();
    var diff = 9999;
    var target = -1;
    for (var i = 0; i < this._enemies.length; i++) {
        if (i != index){
            var diffX = Math.abs(this._enemies[index].spritePosX() - this._enemies[i].spritePosX());
            var diffY = this._enemies[index].spritePosY() - this._enemies[i].spritePosY();
            if (diffY > diffX && diffY < diff)  {
                diff = diffY;
                target = i
            }
        } 
    }
    if (target >= 0) this.select(target);
};

Window_BattleEnemy.prototype.cursorRight = function(wrap) {
    var index = this.index();
    var diff = 9999;
    var target = -1;
    for (var i = 0; i < this._enemies.length; i++) {
        if (i != index){
            var diffX = this._enemies[i].spritePosX() - this._enemies[index].spritePosX();
            var diffY = Math.abs(this._enemies[index].spritePosY() - this._enemies[i].spritePosY());
            if (diffX > diffY && diffX < diff)  {
                diff = diffX;
                target = i
            }
        } 
    }
    if (target >= 0) this.select(target);
};

Window_BattleEnemy.prototype.cursorLeft = function(wrap) {
    var index = this.index();
    var diff = 9999;
    var target = -1;
    for (var i = 0; i < this._enemies.length; i++) {
        if (i != index){
            var diffX = this._enemies[index].spritePosX() - this._enemies[i].spritePosX();
            var diffY = Math.abs(this._enemies[index].spritePosY() - this._enemies[i].spritePosY());
            if (diffX > diffY && diffX < diff)  {
                diff = diffX;
                target = i
            }
        } 
    }
    if (target >= 0) this.select(target);
};

Window_BattleEnemy.prototype.autoSelect = function() {
    var selectIndex = this.furthestRight();
    this.select(selectIndex);
};

Window_BattleEnemy.prototype.furthestRight = function() {
    return this.maxItems() - 1;
};

Window_BattleEnemy.prototype.updateHelp = function() {
    if (!this._helpWindow) return;
    this._helpWindow.setBattler(this.enemy());
};

Alias.WiBaEn_processTouch = Window_BattleEnemy.prototype.processTouch;
Window_BattleEnemy.prototype.processTouch = function() {
    if (this.isOpenAndActive()) {
      if (TouchInput.isTriggered() && !this.isTouchedInsideFrame()) {
        if (this.getClickedEnemy() >= 0) {
          var index = this.getClickedEnemy();
          if (this.index() === index) {
            return this.processOk();
          } else {
            SoundManager.playCursor();
            return this.select(index);
          }
        }
      }
      if (TouchInput.isPressed() && !this.isTouchedInsideFrame()) {
        if (this.getClickedEnemy() >= 0) {
          var index = this.getClickedEnemy();
          if (this.index() !== index) {
            SoundManager.playCursor();
            return this.select(index);
          }
        }
      }
        var index = this.getMouseOverEnemy();
        if (index >= 0 && this.index() !== index) {
          SoundManager.playCursor();
          return this.select(index);
        }
    };
    Alias.WiBaEn_processTouch.call(this);
};

Window_BattleEnemy.prototype.getClickedEnemy = function() {
    for (var i = 0; i < this._enemies.length; ++i) {
      var enemy = this._enemies[i];
      if (!enemy) continue;
      if (this.isClickedEnemy(enemy)) {
        if (this._selectDead && !enemy.isDead()) continue;
        var index = this._enemies.indexOf(enemy)
        if (this._inputLock && index !== this.index()) continue;
        return index;
      }
    }
    return -1;
};

Window_BattleEnemy.prototype.isClickedEnemy = function(enemy) {
    if (!enemy) return false;
    if (!enemy.isSpriteVisible()) return false;
    if ($gameTemp._disableMouseOverSelect) return false;
    var x = TouchInput.x;
    var y = TouchInput.y;
    var rect = new Rectangle();
    rect.width = enemy.spriteWidth();
    rect.height = enemy.spriteHeight();
    rect.x = enemy.spritePosX() - rect.width / 2;
    rect.y = enemy.spritePosY() - rect.height;
    return (x >= rect.x && y >= rect.y && x < rect.x + rect.width &&
      y < rect.y + rect.height);
};

Window_BattleEnemy.prototype.getMouseOverEnemy = function() {
    for (var i = 0; i < this._enemies.length; ++i) {
      var enemy = this._enemies[i];
      if (!enemy) continue;
      if (this.isMouseOverEnemy(enemy)) {
        if (this._selectDead && !enemy.isDead()) continue;
        var index = this._enemies.indexOf(enemy)
        if (this._inputLock && index !== this.index()) continue;
        return index;
      }
    }
    return -1;
};

Window_BattleEnemy.prototype.isMouseOverEnemy = function(enemy) {
    if (!enemy) return false;
    if (!enemy.isSpriteVisible()) return false;
    if ($gameTemp._disableMouseOverSelect) return false;
    var x = TouchInput._mouseOverX;
    var y = TouchInput._mouseOverY;
    var rect = new Rectangle();
    rect.width = enemy.spriteWidth();
    rect.height = enemy.spriteHeight();
    rect.x = enemy.spritePosX() - rect.width / 2;
    rect.y = enemy.spritePosY() - rect.height;
    return (x >= rect.x && y >= rect.y && x < rect.x + rect.width &&
      y < rect.y + rect.height);
};

//-----------------------------------------------------------------------------
// Window_BattleSkill

Alias.WiBaSk_initialize = Window_BattleSkill.prototype.initialize;
Window_BattleSkill.prototype.initialize = function(x, y, width, height) {
    Alias.WiBaSk_initialize.call(this, x, y, width, height);
};

Window_BattleSkill.prototype.setStatusWindow = function(statusWindow) {
    this._statusWindow = statusWindow;
};

Window_BattleSkill.prototype.setActor = function(actor) {
    Window_SkillList.prototype.setActor.call(this, actor);
    if (this._statusWindow)
        this._statusWindow.setActor(actor);
};

//18
Alias.WiBaSk_show = Window_BattleSkill.prototype.show;
Window_BattleSkill.prototype.show = function() {
    if (this._statusWindow) {
        this._statusWindow.refresh();
        this._statusWindow.show();
    }
    this._helpWindow.show();
    Alias.WiBaSk_show.apply(this, arguments);
};

// tabで説明欄の表示/非表示切り替え
Alias.WiBaSk_processCursorMove = Window_BattleSkill.prototype.processCursorMove;
Window_BattleSkill.prototype.processCursorMove = function() {
    Alias.WiBaSk_processCursorMove.call(this);
    if (this.isCursorMovable()) {
        if (Input.isTriggered('tab')) {
            BattleManager._showHelp = !BattleManager._showHelp;
            this.showHelpWindow();
        }
    }
};

Window_BattleSkill.prototype.showHelpWindow = function() {
    if (this._helpWindow && BattleManager._showHelp) {
        this._helpWindow.open();
    } else {
        this._helpWindow.close();
    }
};

//24
Alias.WiBaSk_hide = Window_BattleSkill.prototype.hide;
Window_BattleSkill.prototype.hide = function() {
    if (this._statusWindow)
        this._statusWindow.hide();
    Window_SkillList.prototype.hide.call(this);
};

//-----------------------------------------------------------------------------
// Window_BattleItem

Alias.WiBaIt_initialize = Window_BattleItem.prototype.initialize;
Window_BattleItem.prototype.initialize = function(x, y, width, height) {
    Alias.WiBaIt_initialize.call(this, x, y, width, height);
    this._type = 0;
    this._level = 3;
};

// tabで説明欄の表示/非表示切り替え
Alias.WiBaIt_processCursorMove = Window_BattleItem.prototype.processCursorMove;
Window_BattleItem.prototype.processCursorMove = function() {
    var lastIndex = this._index;
    Alias.WiBaSk_processCursorMove.call(this);
    if (this.isCursorMovable()) {
        if (Input.isTriggered('tab')) {
            BattleManager._showHelp = !BattleManager._showHelp;
            this.showHelpWindow();
        } else if (Input.isTriggered('up') && lastIndex == this._index && this._type === 0) {
            this.callHandler('equip');
        }
    }
};

Window_BattleItem.prototype.hide = function() {
    Window_ItemList.prototype.hide.call(this);
};

Window_BattleItem.prototype.showHelpWindow = function() {
    if (this._helpWindow && BattleManager._showHelp) {
        this._helpWindow.open();
    } else {
        this._helpWindow.close();
    }
};

Alias.WiBaIt_show = Window_BattleItem.prototype.show;
Window_BattleItem.prototype.show = function() {
    this._helpWindow.show();
    Alias.WiBaIt_show.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Window_AtbSkillStatus

Window_AtbSkillStatus.prototype = Object.create(Window_Base.prototype);
Window_AtbSkillStatus.prototype.constructor = Window_AtbSkillStatus;

Window_AtbSkillStatus.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.hide();
};

Window_AtbSkillStatus.prototype.setActor = function(actor) {
    if (this._actor !== actor) {
        this._actor = actor;
        this.refresh();
    }
};

Window_AtbSkillStatus.prototype.refresh = function() {
    this.contents.clear();
    if (this._actor) {
        var y = 0;
        var height = this.lineHeight();
        var width = this.contentsWidth();
        if (MPPlugin.SkillWindowHpDraw) {
            this.drawActorHp(this._actor, 0, y, width);
            y += height;
        }
        this.drawActorMp(this._actor, 0, y, width);
        if ($dataSystem.optDisplayTp) {
            this.drawActorTp(this._actor, 0, y + height, width);
        }
    }
};

//-----------------------------------------------------------------------------
// Sprite_Actor

//141
Alias.SpAc_updateTargetPosition = Sprite_Actor.prototype.updateTargetPosition;
Sprite_Actor.prototype.updateTargetPosition = function() {
    if (MPPlugin.inputStepForward || !this._actor.isInputting()) {
        Alias.SpAc_updateTargetPosition.apply(this, arguments);
    }
};

//208
Alias.SpAc_refreshMotion = Sprite_Actor.prototype.refreshMotion;
Sprite_Actor.prototype.refreshMotion = function() {
    if (MPPlugin.escapeAnime) {
        var actor = this._actor;
        if (BattleManager.isEscaping() && actor && !actor.isActing() &&
            actor.stateMotionIndex() < 2 && actor.canMove()) {
            return this.startMotion('escape');
        }
    }
    Alias.SpAc_refreshMotion.apply(this, arguments);
};

//-----------------------------------------------------------------------------
// Scene_Battle

//22
Alias.ScBa_start = Scene_Battle.prototype.start;
Scene_Battle.prototype.start = function() {
    BattleManager._refreshHandler = this.refreshStatus.bind(this);
    BattleManager._waitHandler = this.isAtbWait.bind(this);
    // 連続魔状況をリセット
    this._inSerialMagic = false;
    Alias.ScBa_start.apply(this, arguments);
};

Scene_Battle.prototype.isAtbWait = function() {
    if (!this._partyCommandWindow.isClosed()) {
        return true;
    }
    var mode = BattleManager.atbMode();
    if (mode === "wait") {
        if (this._skillWindow.visible || this._itemWindow.visible ||
                this._actorWindow.visible || this._enemyWindow.visible) {
            return true;
        }
    } else if (mode === "stop") {
        if (this._actor && !BattleManager.isFastForward()) {
            return true;
        }
    }
    return false;
};

//41
Scene_Battle.prototype.updateBattleProcess = function() {
    //if (!this.isAnyInputWindowActive() || BattleManager.isAborting() ||
    //        BattleManager.isBattleEnd()) {
        BattleManager.update();
        this.changeInputWindow();
    //}
};

//58
Scene_Battle.prototype.changeInputWindow = function() {
    if (!this._partyCommandWindow.isClosed() ||
            this._actorCommandWindow.isClosing() ||
            !BattleManager._phase) {
        return;
    } else if (this._actor !== BattleManager.actor()) {
        if (MPPlugin.FastCancelByInput)
            BattleManager._atbFast = false;
        this._actor = BattleManager.actor();
        if (this._actor && !BattleManager.isBattleEnd()) {
            this._actorCommandWindow.openness = 0;
            this.startActorCommandSelection();
        } else {
            this.endCommandSelection();
        }
    } else if (!this._actor) {
        if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            SoundManager.playCancel();
            this.startPartyCommandSelection();
        }
    }
};

//82
Alias.ScBa_terminate = Scene_Battle.prototype.terminate;
Scene_Battle.prototype.terminate = function() {
    Alias.ScBa_terminate.apply(this, arguments);
    if (this._changeAtbMode) ConfigManager.save();
};

//106
Scene_Battle.prototype.updateWindowPositions = function() {
    var statusX = 192 + 108;
    var statusWindow = this._statusWindow;
    if (statusWindow.x < statusX) {
        statusWindow.x = Math.min(statusWindow.x + 16, statusX);
    }
    if (statusWindow.x > statusX) {
        statusWindow.x = Math.max(statusWindow.x - 16, statusX);
    }
};

//161
Alias.ScBa_createStatusWindow = Scene_Battle.prototype.createStatusWindow;
Scene_Battle.prototype.createStatusWindow = function() {
    Alias.ScBa_createStatusWindow.apply(this, arguments);
    this._statusWindow.setHandler('ok',  this.onStatusOk.bind(this));
    this._statusWindow.setHandler('pageup', this.selectPreviousCommand.bind(this));
    this._statusWindow.setHandler('pagedown', this.selectNextCommand.bind(this));
};

//166
Scene_Battle.prototype.createPartyCommandWindow = function() {
    this._partyCommandWindow = new Window_PartyCommand();
    this._partyCommandWindow.setHandler('escape', this.commandEscape.bind(this));
    this._partyCommandWindow.setHandler('atbMode', this.onAtbMode.bind(this));
    this._partyCommandWindow.setHandler('cancel', this.onPartyCancel.bind(this));
    this._partyCommandWindow.deselect();
    this.addWindow(this._partyCommandWindow);
};

//174
Alias.ScBa_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
Scene_Battle.prototype.createActorCommandWindow = function() {
    Alias.ScBa_createActorCommandWindow.apply(this, arguments);
    this._actorCommandWindow.setHandler('cancel', this.startPartyCommandSelection.bind(this));
    this._statusWindow.setActorCmdWindow(this._actorCommandWindow);
    // 防御などのサブコマンドウィンドウ追加
    this._actorCommandSubWindow = new Window_ActorSubCommand(58 + this._actorCommandWindow.width, this._actorCommandWindow.y);
    this._actorCommandSubWindow.setHandler('cancel',  this.subToCommand.bind(this));
    this._actorCommandSubWindow.setHandler('guard',  this.commandGuard.bind(this));
    this._actorCommandWindow.setHandler('sub', this.commandToSub.bind(this));
    this._actorCommandWindow.setHelpWindow(this._helpWindow);
    this.addWindow(this._actorCommandSubWindow);

};

Scene_Battle.prototype.commandToSub = function() {
    this._actorCommandSubWindow._lastIndex = this._actorCommandWindow._index;
    this._actorCommandWindow.deselect();
    this._actorCommandWindow.deactivate();
    this._actorCommandSubWindow.select(0);
    this._actorCommandSubWindow.activate();
    this._actorCommandSubWindow.show();
};
Scene_Battle.prototype.subToCommand = function() {
    this._actorCommandSubWindow.deselect();
    this._actorCommandSubWindow.deactivate();
    this._actorCommandSubWindow.hide();
    this._actorCommandWindow.select(this._actorCommandSubWindow._lastIndex);
    this._actorCommandWindow.activate();
};

function Window_ActorSubCommand() {
    this.initialize.apply(this, arguments);
}
Window_ActorSubCommand.prototype = Object.create(Window_ActorCommand.prototype);
Window_ActorSubCommand.prototype.constructor = Window_ActorSubCommand;
Window_ActorSubCommand.prototype.initialize = function(x, y) {
    Window_Command.prototype.initialize.call(this, x, y);
    this.deactivate();
    this.hide();
    this._actor = null;
    this._lastIndex = 0;
};
Window_ActorSubCommand.prototype.makeCommandList = function() {
    if (this._actor) {
        this.addGuardCommand();
    }
};
Window_ActorSubCommand.prototype.processCursorMove = function() {
    Alias.WiAcCo_processCursorMove.call(this);
    if (this.isCursorMovable()) {
        if (Input.isTriggered('left')) {
            this.callHandler('cancel');
        }
    }
};
Window_ActorSubCommand.prototype.setup = function(actor) {
    Alias.WiAcCo_setup.call(this, actor);
    this.deactivate();
    this.hide();
    this._lastIndex = 0;
};
Window_ActorSubCommand.prototype.windowWidth = function() {
    return 100;
};

Window_ActorSubCommand.prototype.windowHeight = function() {
    return this.fittingHeight(1);
};

//184
Scene_Battle.prototype.createHelpWindow = function() {
    if (MPPlugin.helpWindowPos >= 0) {
        this._helpWindow = new Window_Help(MPPlugin.helpWindowRow);
        if (!BattleManager._showHelp) this._helpWindow.close();
        this._helpWindow.visible = false;
        if (MPPlugin.helpWindowPos === 1) {
            this._helpWindow.y = this._statusWindow.y - this._helpWindow.height;
        }
        this.addWindow(this._helpWindow);
    }
};

//190
Scene_Battle.prototype.createSkillWindow = function() {
    var wy = this._statusWindow.y;
    var ww = Graphics.boxWidth - 144
    var wh = this._statusWindow.height;
    this._skillWindow = new Window_BattleSkill(0, wy, ww, wh);
    this._skillWindow.setHelpWindow(this._helpWindow);
    this._skillWindow.setHandler('ok',     this.onSkillOk.bind(this));
    this._skillWindow.setHandler('cancel', this.onSkillCancel.bind(this));
    this.addWindow(this._skillWindow);

    this._skillStatusWindow = new Window_AtbSkillStatus(ww, wy, 144, wh);
    this.addWindow(this._skillStatusWindow);
    this._skillWindow.setStatusWindow(this._skillStatusWindow);
};

//200
Scene_Battle.prototype.createItemWindow = function() {
    var wy = this._statusWindow.y;
    var wh = this._statusWindow.height;
    this._itemWindow = new Window_BattleItem(0, wy, Graphics.boxWidth, wh);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setHandler('ok',     this.onItemOk.bind(this));
    this._itemWindow.setHandler('cancel', this.onItemCancel.bind(this));
    this._itemWindow.setHandler('equip', this.commandEquip.bind(this));
    this.addWindow(this._itemWindow);
};

//210
Alias.ScBa_createActorWindow = Scene_Battle.prototype.createActorWindow;
Scene_Battle.prototype.createActorWindow = function() {
    Alias.ScBa_createActorWindow.apply(this, arguments);
    this._actorWindow.x = Graphics.boxWidth - this._actorWindow.width;
};

//238
Alias.ScBa_refreshStatus = Scene_Battle.prototype.refreshStatus;
Scene_Battle.prototype.refreshStatus = function() {
    Alias.ScBa_refreshStatus.apply(this, arguments);
    this._actorCommandWindow.refresh();
    if (this._skillWindow.visible) this._skillWindow.refresh();
    if (this._skillStatusWindow.visible) this._skillStatusWindow.refresh();
    if (this._itemWindow.visible)  this._itemWindow.refresh();
    if (this._actorWindow.visible) this._actorWindow.refresh();
    if (this._enemyWindow.visible) this._enemyWindow.refresh();
    // 【追加】敵名ウィンドウもリフレッシュ
    if (this._battleEnemyNamesWindow.visible) this._battleEnemyNamesWindow.refresh();
};

//242
Scene_Battle.prototype.startPartyCommandSelection = function() {
    this.refreshStatus();
    this._statusWindow.deselect();
    this._statusWindow.open();
    this._actorCommandWindow.deactivate();
    this._actorCommandWindow.close();
    this._partyCommandWindow.setup();
    this._actor = null;
};

//250
Scene_Battle.prototype.commandFight = function() {
    BattleManager.setEscaping(false);
    this._partyCommandWindow.close();
};

//254
Scene_Battle.prototype.commandEscape = function() {
    BattleManager.setEscaping(true);
    this._partyCommandWindow.close();
};

Scene_Battle.prototype.onAtbMode = function() {
    ConfigManager.onAtbMode();
    this._changeAtbMode = true;
    this._partyCommandWindow.refresh();
    this._partyCommandWindow.activate();
};

Scene_Battle.prototype.onPartyCancel = function() {
    this._partyCommandWindow.close();
};

//259
Alias.ScBa_startActorCommandSelection = Scene_Battle.prototype.startActorCommandSelection;
Scene_Battle.prototype.startActorCommandSelection = function() {
    AudioManager.playStaticSe(MPPlugin.ActiveSE);
    Alias.ScBa_startActorCommandSelection.apply(this, arguments);
    this._actorCommandSubWindow.setup(BattleManager.actor());
    this._skillWindow.deactivate();
    this._skillWindow.hide();
    this._itemWindow.deactivate();
    this._itemWindow.hide();
    this._actorWindow.deactivate();
    this._actorWindow.hide();
    this._enemyWindow.deactivate();
    this._enemyWindow.hide();
    this._helpWindow.show();
    MPPATB_Variable.commandPause = Math.max(MPPATB_Variable.commandPause, 8);
};

//265
Alias.ScBa_commandAttack = Scene_Battle.prototype.commandAttack;
Scene_Battle.prototype.commandAttack = function() {
    if (BattleManager.inputtingAction())
        Alias.ScBa_commandAttack.apply(this, arguments);
};

//278
Alias.ScBa_commandGuard = Scene_Battle.prototype.commandGuard;
Scene_Battle.prototype.commandGuard = function() {
    if (BattleManager.inputtingAction()) {
        BattleManager.inputtingAction().setGuard();
        BattleManager.actor().onMadeAction();
        Alias.ScBa_commandGuard.apply(this, arguments);
    }
};

Scene_Battle.prototype.onStatusOk = function() {
    BattleManager.changeActor(this._statusWindow.index(), 'undecided');
    this.changeInputWindow();
};

//299
Alias.ScBa_selectActorSelection = Scene_Battle.prototype.selectActorSelection;
Scene_Battle.prototype.selectActorSelection = function() {
    Alias.ScBa_selectActorSelection.apply(this, arguments);
    this._actorWindow.selectForItem();
};

//305
Alias.ScBa_onActorOk = Scene_Battle.prototype.onActorOk;
Scene_Battle.prototype.onActorOk = function() {
    if (BattleManager.inputtingAction()) {
        BattleManager.actor().onMadeAction();
        Alias.ScBa_onActorOk.apply(this, arguments);
    }
};

//328
Alias.ScBa_selectEnemySelection = Scene_Battle.prototype.selectEnemySelection;
Scene_Battle.prototype.selectEnemySelection = function() {
    Alias.ScBa_selectEnemySelection.apply(this, arguments);
    this._enemyWindow.selectForItem();
};

//335
Alias.ScBa_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
Scene_Battle.prototype.onEnemyOk = function() {
    if (BattleManager.inputtingAction()) {
        BattleManager.actor().onMadeAction();
        Alias.ScBa_onEnemyOk.apply(this, arguments);
    }
};

//361
Alias.ScBa_onSkillOk = Scene_Battle.prototype.onSkillOk;
Scene_Battle.prototype.onSkillOk = function() {
    if (BattleManager.inputtingAction())
        var skill = this._skillWindow.item();
        var action = BattleManager.inputtingAction();
        action.setSkill(skill.id);
        if (this._skillWindow._stypeId == 34 && !this._inSerialMagic) {
            this._inSerialMagic = true;
        } else this._inSerialMagic = false;
        BattleManager.actor().setLastBattleSkill(skill);
        this.onSelectAction();
};

//374
Alias.ScBa_onItemOk = Scene_Battle.prototype.onItemOk;
Scene_Battle.prototype.onItemOk = function() {
    if (BattleManager.inputtingAction())
        Alias.ScBa_onItemOk.apply(this, arguments);
};

//387
Scene_Battle.prototype.onSelectAction = function() {
    var action = BattleManager.inputtingAction();
    if (action) {
        if (!MPPlugin.ForceTargetSelect && !action.needsSelection()) {
            if (this._inSerialMagic) {
                var action = BattleManager.inputtingAction();
                if (BattleManager.actor()._change_scope) {
                    BattleManager.actor()._change_scope = false;
                    action._change_scope = true;
                }
                action.setTarget(this._actorWindow.index());
                BattleManager.actor()._actionInputIndex++;
                this._skillWindow.activate();
            } else {
                BattleManager.actor().onMadeAction();
                this._skillWindow.hide();
                this._itemWindow.hide();
                this.selectNextCommand();
            }
        } else if (action.isForOpponent()) {
            this.selectEnemySelection();
        } else {
            this.selectActorSelection();
        }
    }
};

//400
Alias.ScBa_endCommandSelection = Scene_Battle.prototype.endCommandSelection;
Scene_Battle.prototype.endCommandSelection = function() {
    this._actor = null;
    Alias.ScBa_endCommandSelection.apply(this, arguments);
    this._actorCommandSubWindow.deactivate();
    this._actorCommandSubWindow.hide();
    this._skillWindow.deactivate();
    this._skillWindow.hide();
    this._itemWindow.deactivate();
    this._itemWindow.hide();
    this._actorWindow.deactivate();
    this._actorWindow.hide();
    this._enemyWindow.deactivate();
    this._enemyWindow.hide();
};


})();


//------------------------------------------
// Yanfly.BattleCoreEngineからの移植
// 移植が足りずbattlerからspriteを引く機能が機能してなかったので追加
//------------------------------------------

BattleManager.getSprite = function(battler) {
  if (!this._registeredSprites) this._registeredSprites = {};
  if (battler.isActor()) var id = 100000 + battler.actorId();
  if (battler.isEnemy()) var id = 200000 + battler.index();
  return this._registeredSprites[id];
};

BattleManager.registerSprite = function(battler, sprite) {
    if (!this._registeredSprites) this._registeredSprites = {};
    if (battler.isActor()) var id = 100000 + battler.actorId();
    if (battler.isEnemy()) var id = 200000 + battler.index();
    this._registeredSprites[id] = sprite;
};

Yanfly_BEC_Sprite_Battler_setBattler = Sprite_Battler.prototype.setBattler;
Sprite_Battler.prototype.setBattler = function(battler) {
    Yanfly_BEC_Sprite_Battler_setBattler.call(this, battler);
    if (battler) battler.setBattler(this);
};

Game_Battler.prototype.setBattler = function(sprite) {
    BattleManager.registerSprite(this, sprite);
};

Game_Battler.prototype.battler = function() {
    return BattleManager.getSprite(this);
};

Game_Battler.prototype.spritePosX = function() {
    if ($gameSystem.isSideView() && this.battler()) {
      return this.battler().x;
    } else if (this.battler()) {
      return this.battler().x;
    } else {
      return 0;
    }
};

Game_Battler.prototype.spritePosY = function() {
    if ($gameSystem.isSideView() && this.battler()) {
      return this.battler().y;
    } else if (this.battler()) {
      return this.battler().y;
    } else {
      return 0;
    }
};

Game_Battler.prototype.spriteWidth = function() {
    if ($gameSystem.isSideView() && this.battler() && this.battler().bitmap) {
      return this.battler().bitmap.width;
    } else if (this.battler() && this.battler().bitmap) {
      return this.battler().bitmap.width;
    } else {
      return 1;
    }
};

Game_Battler.prototype.spriteHeight = function() {
    if ($gameSystem.isSideView() && this.battler() && this.battler().bitmap) {
      return this.battler().bitmap.height;
    } else if (this.battler() && this.battler().bitmap) {
      return this.battler().bitmap.height;
    } else {
      return 1;
    }
};

//=============================================================================
// UpdateDrawer
//=============================================================================

(function() {

if (!Window_Base.Mpp_UpdateDrawer) {

    const Alias = {};

    //-----------------------------------------------------------------------------
    // Window_Base

    //13
    Alias.WiBa_initialize = Window_Base.prototype.initialize;
    Window_Base.prototype.initialize = function(x, y, width, height) {
        Alias.WiBa_initialize.apply(this, arguments);
        this._updateDrawers = [];
    };

    //105
    Alias.WiBa_update = Window_Base.prototype.update;
    Window_Base.prototype.update = function() {
        Alias.WiBa_update.apply(this, arguments);
        this.updateDrawer();
    };

    Window_Base.prototype.updateDrawer = function() {
        if (this.isOpen() && this.visible && this._updateDrawers.length > 0) {
            this._updateDrawers = this._updateDrawers.filter( process => process() );
        }
    };

    Window_Base.prototype.addUpdateDrawer = function(process) {
        this._updateDrawers.push(process);
    };

    Window_Base.prototype.clearUpdateDrawer = function() {
        this._updateDrawers = [];
    };

    Window_Base.Mpp_UpdateDrawer = 1;
} //if (!Window_Base.Mpp_UpdateDrawer)


})();
