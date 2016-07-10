'use strict';
if (window.AnnTools && AnnTools.core) throw new Error('class AnnToolsCore: 不能重复加载核心类');
if (!mw.config.values.wgUserId) throw new Error('class AnnToolsCore: 用户尚未登陆');
// 初始化
window.AnnTools = window.AnnTools || {};
AnnTools._global = {};
// 一些由开发者预定的全局设置
Object.assign(AnnTools._global, {
    VERSION: '0.0.1',
    AUTHOR: 'AnnAngela',
    USERPAGE: 'user:AnnAngela',
    EMAIL: 'annangela@moegirl.org',
    ROOT: '',
    mode: localStorage.getItem('AnnTools-global-mode') || 'es5',
    libraries: [['Network', 'UI', 'JQueryExtend'], [], ['Run']],
    apiPath: 'https://zh.moegirl.org/api.php',
});
/* Polyfill */
if (!String.prototype.includes) Object.assing(String.prototype, {
    includes(search, start) {
        'use strict';
        if (typeof start !== 'number') start = 0;
        if (start + search.length > this.length) return false;
        return this.indexOf(search, start) !== -1;
    },
});
if (!Array.prototype.includes) Object.assing(Array.prototype, {
    includes(searchElement, fromIndex) {
        'use strict';
        if (typeof fromIndex !== 'number') fromIndex = 0;
        if (fromIndex >= this.length) return false;
        return this.indexOf(searchElement, fromIndex);
    },
});
Object.assign(String.prototype, {
    toUpperFirstCase() {
        return this[0] ? this[0].toUpperCase() + this.slice(1) : this;
    },
    toLowerFirstCase() {
        return this[0] ? this[0].toLowerCase + this.slice(1) : this;
    },
});
/* 核心类 */
class AnnToolsCore {
    /* 设置同步 */
    constructor() {
        const global = window.AnnTools;
        if (global._global.devmodeOn) console.debug('AnnToolsCore类初始化中……');
        // global[开发者预设] => localStorage
        for (let i in global._global) localStorage.setItem(`AnnTools-global-${i}`, global._global[i]);
        delete global._global;
        Object.assign(this, {
            global,
            inited: false,
            devmodeOn: localStorage.getItem('AnnTools-global-devmodeOn') === 'true',
            registry: {},
            hookList: [],
            UNDEFINED_PARAMETER: window.Symbol ? Symbol('AnnToolsCore.UNDEFINED_PARAMETER') : undefined,
        });
        if (mw.config.values.wgUserGroups.includes('sysop') || mw.config.values.wgUserGroups.includes('patroller')) this.init();
    }
    /**
     * 自定义错误抛出
     * @param {String} lib - l指明抛出错误的库名
     * @param {String} message - m指出为何抛出错误 
     */
    error(lib, message) {
        console.error(`AnnTools.${lib}: ${message}`);
    }
    /**
     * 自定义警告抛出
     * @param {String} lib - lib指明抛出警告的库名
     * @param {String} message - message指出为何抛出警告
     */
    warn(lib, message) {
        console.warn(`AnnTools.${lib}: ${message}\n${new Error().stack.replace('Error', 'Warn')}`);
    }
    /**
     * 获取全局设置
     * @param {String} [key] - key指定需要获取的全局设置的键，如不传入则返回所有全局设置
     * @param {String} [type=string] - type为预期的获取的值的类型(String|Number|Boolean|Array|Object)，不分大小写
     * @returns {*} 返回全局设置中指定key并已转化为指定type的值
     */
    getGlobalConfig(key = this.UNDEFINED_PARAMETER, type = 'string') {
        if (key == this.UNDEFINED_PARAMETER) {
            let o = {};
            for (let i in localStorage) {
                if (/^AnnTools-global/.test(i)) o[i.replace('AnnTools-global', '')] = localStorage[i];
            }
            return o;
        }
        let v = localStorage.getItem(`AnnTools-global-${key}`);
        if (v === undefined) {
            this.warn('core.getGlobalConfig', `key为"${key}"的全局设置不存在。`);
            return undefined;
        }
        type = type.toUpperFirstCase();
        switch (type) {
            case 'Number': return +v;
            case 'Boolean': return !!v;
            case 'Array':
            case 'Object': try {
                return JSON.parse(v);
            } catch (e) {
                this.error('core.getGlobalConfig', `key为"${key}"的全局设置转化为${type}类型时失败：${e.message}。`);
                return null;
            }
            default:
            case 'String': return v;
        }
    }
    /**
     * 储存全局设置
     * @param {String} key - key指定需要储存的全局设置的键
     * @param {(String|Number|Boolean|Array|Object)} value - value为需要储存的全局设置的值
     */
    setGlobalConfig(key = this.UNDEFINED_PARAMETER, value = this.UNDEFINED_PARAMETER) {
        if (value === this.UNDEFINED_PARAMETER) return this.error('core.setGlobalConfig', `未传入需储存的全局设置的值`);
        if (key === this.UNDEFINED_PARAMETER) return this.error('core.setGlobalConfig', `未传入需储存的全局设置的键`);
        let t = Object.prototype.toString.call(value).slice(8, -1).toLowerCase(),
            _k = `AnnTools-global-${key}`;
        if (['array', 'object'].includes(t)) value = JSON.stringify(value);
        localStorage.setItem(_k, value);
        if (localStorage.getItem(_k) !== value + '') {
            this.error('core.setGlobalConfig', `key为"${key}"的全局设置无法完整保存。`);
            this.removeGlobalConfig(key);
        }
    }
    /**
     * 移除全局设置
     * @param {String} key - key指定需要移除的全局设置的键
     */
    removeGlobalConfig(key = this.UNDEFINED_PARAMETER) {
        if (key === this.UNDEFINED_PARAMETER) return this.error('core.removeGlobalConfig', `未传入需移除的全局设置的键`);
        localStorage.remo(`AnnTools-global-${key}`);
    }
    /**
     * 获得参数传入的库
     * @param {(String|Array)} list - list指定一个需要加载的库的列表，以数组形式列出，如果只需加载一个库也可以直接传入库的名称
     */
    require(list) {
        const self = this;
        if (typeof list === 'string') list = [list];
        list.forEach(function (n) {
            this.registry[n].stage = 'loading';
        });
        return Promise.all(list.map(l => new Promise(function (res, rej) {
            $('script')
                .on({
                    load: res,
                    error: rej,
                })
                .attr('src', `${self.getGlobalConfig('ROOT')}/${self.getGlobalConfig('mode')}/${l}.js${self.devmodeOn ? `?_=${new Date().getTime()}` : ''}`)
                .appendTo('head');
        }).fail(function () {
            self.error('core.require', `加载${l}库失败。`);
            self.registry[l].stage = 'fail';
        }).catch(function (e) {
            self.error('core.require', `加载${l}库错误(${e.message})`);
            self.registry[l].stage = 'error';
        })))
            .then(this.checkHookList);
    }
    /**
     * 初始化工具的基础部件
     * @param {Number} [index=0] - index指明初始化部件的当前加载阶段，为空则表明是第一阶段，i+1为阶段数
     */
    init(index = 0) {
        let libgroup = this.getGlobalConfig('libraries')[index];
        if (this.inited) this.error('core.init', '核心类已初始化。');
        else if (!libgroup) this.inited = true;
        else libgroup.forEach(function (n) {
            this.register({
                name: n,
                version: this.version,
                dependencies: index ? this.getGlobalConfig('libraries').slice(0, index) : [],
                module: null,
            });
        });
    }
    //TODO: registry/register
    register({
        name,
        version,
        dependencies,
        module,
    }) {
        if (this.registry[name] && this.registry[name].module === module) return this.error('core.register', `${name}库重复注册。`);
        let path = name.toLowerFirstCase();
        Object.assign(this.registry, {
            name: {
                path,
                version,
                dependencies,
                module,
                stage: 'unload',
            }
        });
        this.addHook(name);
    }
    addHook(name) {
        let lib = this.registry[name];
        if (!lib) return this.error('core.addHook', `所请求的${name}库不存在`);
        if ($.isArray(lib.dependencies) && lib.dependencies[0])
            for (let i = 0, l = lib.dependencies; i < l; i++) {
                let d = lib.dependencies[i];
                if (!this.registry[d] || this.registry[d].stage !== 'loaded') {
                    lib.stage = 'pending';
                    break;
                }
            }
        else delete lib.dependencies;
        if (lib.stage === 'pending') this.hookList.push(lib);
        else if (lib.module) {
            this.global[lib.path] = new lib.module(this);
            lib.stage = 'loaded';
            this.checkHookList();
        }
        else this.require(lib.name);
    }
    checkHookList() {
        if (!this.hookList[0]) return;
        let gFlag = false;
        this.hookList.forEach(function (lib) {
            let flag = true;
            if (lib.dependencies[0]) lib.dependencies.forEach(function (d) {
                if (!this.registry[d.name] || this.registry[d.name].stage !== 'loaded') flag = false;
            }, this);
            if (!flag) return;
            if (lib.module) {
                this.global[lib.path] = new lib.module(this);
                lib.stage = 'loaded';
                gFlag = true;
            }
            else this.require(lib.name);
        }, this);
        if (gFlag) return this.checkHookList();
    }
}
AnnTools.core = new AnnToolsCore();