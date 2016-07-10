'use strict';
if (window.AnnTools && window.AnnTools.core) throw new Error('class AnnToolsNetwork: 未加载核心类');
class AnnToolsUI {
    /**
     * 添加核心类引用
     * @param {AnnToolsCore} core - core是核心类的一个引用
     */
    constructor(core) {
        if (core.devmodeOn) console.debug("AnnToolsUI类初始化中……");
        Object.assign(this, {
            core,
        });
    }
    /**
     * 页面标题
     * @param {string} title - 指定标题
     */
    specialPageTitle(title) {
        document.title = title + document.title.slice(document.title.indexOf(' - ') === -1 ? 0 : document.title.indexOf(' - '));
        $('#firstHeading').text(title);
    }
    /**
     * Special页绘制
     * @param {object} option - 指定这次绘制的相关信息
     */
    drawSpecialPage(option) { }
}
AnnTools.Core.register({
    name: 'UI',
    version: '0.0.1',
    dependencies: [],
    module: AnnToolsUI,
});