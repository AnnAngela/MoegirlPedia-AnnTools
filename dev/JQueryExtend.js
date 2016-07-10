'use strict';
if (window.AnnTools && window.AnnTools.core) throw new Error('class AnnToolsNetwork: 未加载核心类');
class AnnToolsJQuertExtend {
    constructor(core) {
        if (core.devmodeOn) console.debug("AnnToolsJQuertExtend类初始化中……");
        Object.assign(this, {
            core,
        });
        jQuery.extend({
            disable() {
                return this.each(function () {
                    if ($(this).is('input,button')) this.disabled = true;
                });
            },
            enable() {
                return this.each(function () {
                    if ($(this).is('input,button')) this.disabled = false;
                });
            },
        });
    }
}
AnnTools.Core.register({
    name: 'JQueryExtend',
    version: '0.0.1',
    dependencies: [],
    module: AnnToolsJQuertExtend,
});