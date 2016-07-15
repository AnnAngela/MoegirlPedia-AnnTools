'use strict';
if (window.AnnTools && window.AnnTools.core) throw new Error('class AnnToolsNetwork: 未加载核心类');
/**
 * @private
 * @class AnnToolsJQuertExtend
 */
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
            matchTime() {
                return this.text().match(/(\d{4}年\d{1,2}月\d{1,2}日 \([一二三四五六日]\) \d{2}:\d{2} \([A-Z]{3}\))/g);
            }
        });
    }
}
AnnTools.Core.register({
    name: 'JQueryExtend',
    version: '0.0.1',
    dependencies: [],
    module: AnnToolsJQuertExtend,
});