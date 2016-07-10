'use strict';
/**
 * 通用错误类型定义
 * @typedef {object} AnnToolsNetworkError
 * @property {string} stage - 表明在何阶段发生错误
 * @property {string} type - 说明错误类型
 * @property {string} message - 说明错误信息
 */
/**
 * 通用监视列表操作定义
 * 指定此次操作后相关页面的监视状态：
 * watch表明本页面将被监视，unwatch反之，preferences表明将按照用户设定处理，nochange表明不改变监视状态。
 * 如不指定，MediaWiki默认此值为preferences
 * @typedef {string} AnnToolsNetworkWatchlistOption
 */
if (window.AnnTools && window.AnnTools.core) throw new Error('class AnnToolsNetwork: 未加载核心类');
class AnnToolsNetwork {
    /**
     * 添加核心类引用
     * @param {AnnToolsCore} core - core是核心类的一个引用
     */
    constructor(core) {
        if (core.devmodeOn) console.debug("AnnToolsNetwork类初始化中……");
        Object.assign(this, {
            core,
        });
    }
    /**
     * 生成错误信息
     * @param {string} stage - 表明在何阶段发生错误
     * @param {string} type - 表明错误类型 
     * @param {*} error - 指定错误内容
     * @param {string} [message] - 说明错误信息
     * @param {function} [callback] - 指定回调函数
     * @returns {AnnToolsNetworkError} 返回AnnToolsNetworkError类实例以说明错误信息
     */
    error(stage, type, error, message, callback) {
        if (typeof callback !== 'function') callback = undefined;
        if (typeof message === 'function') {
            callback = message;
        }
        if (typeof message !== 'string') message = undefined;
        if (typeof error !== 'string') error = JSON.stringify(error);
        if (message) message += `(${error})`;
        else message = error;
        let r = {
            stage,
            type,
            message,
        };
        this.core.error(stage, message);
        if (callback) callback(r);
        return r;
    }
    /**
     * 通用后端ajax请求
     * @param {object} [option={}] - option是$.ajax的opt，但会有默认的type值('GET')和url值(当前MediaWIki的apipath)
     * @returns {$.Deferred} 返回一个$.Deferred类实例
     */
    ajax(option = {}) {
        const self = this;
        return $.ajax($.extend(true, {
            type: 'GET',
            url: self.core.getGlobalConfig('apiPath'),
        }, option));
    }
    /**
     * 通用token获取
     * @returns {promise} 返回一个Prmise类实例，如果成功得到token则会进入resolve流程并传递token为参数，如果无法成功得到token则会进入reject流程并传递一个AnnToolsNetworkError类实例
     */
    getToken() {
        const self = this;
        return new Promise(function (res, rej) {
            self.ajax({
                data: {
                    action: 'query',
                    meta: 'tokens',
                },
                error(o) {
                    self.error('network.getToken', 'network', `${o.status} - ${o.statusText}`, '获取token时网络通信失败', rej);
                },
                success(d) {
                    if (d.error) self.error('network.getToken', 'backend', d.error['*'], '获取token时后端失败', rej);
                    else res(d.query.tokens.csrftoken);
                },
            });
        });
    }
    /**
     * 通用页面编辑
     * @param {object} option - 指定此次编辑的相关内容
     * @param {string} [option.page] - 指定编辑的页面名，不列入则默认为当前页面名
     * @param {(number|string)} [option.section=-1] - 指定编辑段落，-1表示全文，0表示首段，"new"表示新段落，不能填写除了"new"以外的其他字符串
     * @param {string} [option.sectiontitle] - 指定新段落的标题，如果section指定为"new"，则sectiontitle必须指定
     * @param {string} option.text - 指定编辑内容
     * @param {string} [option.type=normal] - 指定编辑方式：normal指定此次编辑将text覆盖页面，append指定此次编辑将在页脚追加text而不是覆盖，prepend指定此次编辑将在页首增加text而不是覆盖
     * @param {string} [option.summary] - 指定此次编辑的编辑摘要，为空时MediaWiki将自动填充，当section=new且未设置sectiontitle时，还包括小节标题
     * @param {string} [option.tags] - 指定此次编辑对应的版本的标签，标签列表见当前wiki的[[Special:tags]]
     * @param {boolean} [option.minor=false] - 当minor为true时指定此次编辑为小编辑
     * @param {boolean} [option.bot=false] - 当bot为true时指定此次编辑为机器人编辑
     * @param {AnnToolsNetworkWatchlistOption} [option.watchlist] - 指定此次编辑后页面的监视状态
     * @param {string} [option.contentformat=text/x-wiki] - 指定内容串行化格式：text/x-wiki、text/javascript、application/json、text/css、text/plain
     * @param {string} [option.contentmodel=wikitext] - 指定新内容的内容模型：wikitext、javascript、json、css、text、Scribunto、JsonSchema
     * @returns {promise} 返回一个Promise，当编辑成功时进入resolve流程传递MediaWiki返回的edit对象，失败时进入reject流程传递AnnToolsNetworkError类实例
     */
    edit(option) {
        const self = this;
        if (typeof option.section === 'string' && option.section !== 'new') return self.core.error('network.edit', '传入的section不能为非"new"字符串。');
        let opt = $.extend({
            page: mw.config.get('wgPageName'),
            section: -1,
            type: 'normal',
            minor: false,
            bot: false,
        }, option, //vscode的缩进……
            {
                action: 'edit',
                format: 'json',
            });
        if (opt.type === 'append') {
            opt.appendtext = opt.text;
            delete opt.text;
        } else if (opt.type === 'prepend') {
            opt.prependtext = opt.text;
            delete opt.text;
        }
        delete opt.type;
        if (!["text/x-wiki", "text/javascript", "application/json", "text/css", "text/plain"].includes(opt.contentformat)) delete opt.contentformat;
        if (!["wikitext", "javascript", "json", "css", "text", "Scribunto", "JsonSchema"].includes(opt.contentmodel)) delete opt.contentmodel;
        if (!["watch", "unwatch", "preferences", "nochange"].includes(opt.watchlist)) delete opt.watchlist;
        if (typeof opt.minor !== 'boolean') delete opt.minor;
        if (typeof opt.bot !== 'boolean') delete opt.bot;
        return this.getToken().then(function (token) {
            opt.token = token;
            return new Promise(function (res, rej) {
                self.ajax({
                    type: 'POST',
                    data: opt,
                    success(d) {
                        if (d.error) self.error('network.edit', 'backend', d.error['*'], '执行编辑时后端失败', rej);
                        else res(d.edit);
                    },
                    error(o) {
                        self.error('network.edit', 'network', `${o.status} - ${o.statusText}`, '执行编辑时网络通信失败', rej);
                    },
                });
            });
        });
    }
    /**
     * 通用页面移动
     * @param {object} option - 指定此次移动的相关内容
     * @param {string} [from] - 指定此次移动的源页面，不填则默认为本页面
     * @param {string} to - 指定此次移动的目标页面
     * @param {string} [reason] - 指定此次移动的理由，不填则MediaWiki默认此值为空
     * @param {boolean} [movetalk=false] - 指定此次移动是否将源页面的讨论页一并移动
     * @param {boolean} [noredirect=false] - 指定此次移动是否不带重定向
     * @param {AnnToolsNetworkWatchlistOption} [watchlist] - 指定此次编辑后源页面和目标页面的监视状态
     * @param {boolean} [ignorewarning=true] - 指定此次移动是否忽略任何（非致命性）警告
     * @returns {promise} 返回一个Promise类实例，当编辑成功时进入resolve流程传递MediaWiki返回的move对象，失败时进入reject流程传递AnnToolsNetworkError类实例
     */
    move(option) {
        const self = this;
        if (typeof option.to !== 'string' || !option.to) return self.core.error('network.move', '传入的to值不能为空或非字符串');
        let opt = $.extend({
            from: mw.config.get('wgPageName'),
            movetalk: false,
            noredirect: false,
            ignorewarning: true,
        }, option,
            {
                action: 'edit',
                format: "json",
            });
        if (!["watch", "unwatch", "preferences", "nochange"].includes(opt.watchlist)) delete opt.watchlist;
        if (typeof opt.movetalk !== 'boolean') delete opt.movetalk;
        if (typeof opt.noredirect !== 'boolean') delete opt.noredirect;
        if (typeof opt.ignorewarning !== 'boolean') delete opt.ignorewarning;
        return this.getToken().then(function (token) {
            opt.token = token;
            return new Promise(function (res, rej) {
                self.ajax({
                    type: 'POST',
                    data: opt,
                    success(d) {
                        if (d.error) self.error('network.move', 'backend', d.error['*'], '执行移动时后端失败', rej);
                        else res(d.move);
                    },
                    error(o) {
                        self.error('network.move', 'network', `${o.status} - ${o.statusText}`, '执行移动时网络通信失败', rej);
                    },
                });
            });
        });
    }
    /**
     * 通用页面删除
     * @param {object} option - 指定此次删除的相关内容
     * @param {string} [option.title] - 指定此次删除的页面标题，不填则默认为本页面
     * @param {string} [option.reason] - 指定此次删除的理由，如果未指定MediaWiki将会自动生成一个
     * @param {AnnToolsNetworkWatchlistOption} [option.watchlist] - 指定此次删除后页面的监视状态
     * @returns {promise} 返回一个Promise类实例，当删除成功时进入resolve流程传递MediaWiki返回的delete对象，失败时进入reject流程传递AnnToolsNetworkError类实例
     */
    delete(option) {
        const self = this;
        let opt = $.extend({
            title: mw.config.get('wgPageName'),
        }, option,
            {
                action: 'delete',
                format: 'json',
            });
        if (!["watch", "unwatch", "preferences", "nochange"].includes(opt.watchlist)) delete opt.watchlist;
        return this.getToken().then(function (token) {
            opt.token = token;
            return new Promise(function (res, rej) {
                self.ajax({
                    type: 'POST',
                    data: opt,
                    success(d) {
                        if (d.error) self.error('network.delete', 'backend', d.error['*'], '执行删除时后端失败', rej);
                        else res(d.delete);
                    },
                    error(o) {
                        self.error('network.delete', 'network', `${o.status} - ${o.statusText}`, '执行删除时网络通信失败', res);
                    },
                });
            });
        });
    }
}
AnnTools.Core.register({
    name: 'Network',
    version: '0.0.1',
    dependencies: [],
    module: AnnToolsNetwork,
});