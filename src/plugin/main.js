// 导入插件样式
import scss from './main.scss';

// 导入插件默认配置参数
import defaultConfig from './config/defaultConfig.js';

// import Vue lib
import Vue from 'vue';

// import Vue Components
import commonDialog from './components/common-dialog';
import generator from './pages/index/generator';
import editor from './pages/editor/editor';
import preview from './pages/preview/preview';

// 导入插件 dom 模板
import template from './templates/dom.html';

import _, { cloneDeep, find } from 'lodash';

// es6, es7 polyfill
import './libs/polyfills/polyfills.js';

// 插件方法定义
let methods = {
    
    // 初始化
    init (options) {

        return this.each(function() {
            let elem = this;
            // let settings = $.extend({}, $.fn.contractGenerator.defaults, options);
            let settings = Object.assign({}, $.fn.contractGenerator.defaults, options);

            // 模板 dom 插入到元素
            $(elem).html(template).attr({
                'tml-cg' : '',
                'v-cloak': '',
                'v-show' : "isDisplay"
            });

            elem.vm = new Vue({
                el: elem,
                data: {
                    settings,
                    isDisplay: true
                },
                components: {
                    commonDialog, generator, editor, preview
                },
                methods: {
                    
                    /**
                     * 显示整个组件
                     */
                    show () {
                        this.isDisplay = true;
                    },
                    
                    /**
                     * 隐藏整个组件
                     */
                    hide () {
                        this.isDisplay = false;
                    },

                    /**
                     * 加载合同
                     */
                    loadContract (contract) {
                        this.syncContract(contract);
                        this.editorMode();
                        this.$refs.editor.$nextTick(() => {
                            this.$refs.editor.syncView();
                            this.$refs.editor.resetScrollbar();
                        });
                    },

                    /**
                     * 开始编辑
                     */
                    startEditorMode (contract) {
                        contract = _.cloneDeep(contract);
                        /*let has = _.find(contract.outline, ['subsidiary', 0]);
                        if (contract.duction && !has) {
                            contract.duction.sortBy = 0;
                            contract.duction.title = '引言';
                            contract.duction.prefix = '';
                            contract.outline.splice(0, 0, contract.duction);
                        }*/

                        if (contract.isEmpty) {
                            contract.outline.forEach((outline) => {
                                outline.content = '';
                            });
                        }

                        // this.$refs.editor.outlineList =  _.cloneDeep(this.$refs.editor.contract.outline);
                        // this.$refs.editor.$data.field = this.$refs.generator.$data.$field;
                        // this.$refs.editor.$data.category = this.$refs.generator.$data.$category;
                        this.$refs.editor.contract = contract;
                        this.$refs.editor.outlineList =  _.cloneDeep(contract.outline);

                        this.editorMode();
                    },
                    
                    /**
                     * 生成器模式
                     */
                    generatorMode () {
                        this.$refs.generator.isDisplay = true;
                        this.$refs.generator.isMakeGuide = false;
                        this.$refs.generator.guideStep = 1;
                        this.$refs.editor.isDisplay = false;
                        this.$refs.preview.isDisplay = false;
                    },
                    
                    /**
                     * 编辑器模式
                     */
                    editorMode () {
                        this.$refs.generator.isDisplay = false;
                        this.$refs.editor.isDisplay = true;
                        this.$refs.preview.isDisplay = false;
                    },
                    
                    /**
                     * 预览模式
                     */
                    previewMode () {
                        this.$refs.generator.isDisplay = false;
                        this.$refs.editor.isDisplay = false;
                        this.$refs.preview.isDisplay = true;
                    },
                    
                    /**
                     * 生成器合同数据同步到编辑器
                     * 
                     * @param {Object} contract
                     */
                    syncContract (contract) {
                        this.$refs.editor.contract = contract;
                        this.$refs.editor.outlineList =  _.cloneDeep(contract.outline);
                        this.$refs.editor.undoNav = [];
                        this.$refs.editor.redoNav = [];
                    },
                    
                    /**
                     * 编辑器合同数据同步到预览组件并显示
                     * 
                     * @param {Object} contract
                     */
                    previewContract (contract) {
                        this.$refs.preview.contract = contract;
                        this.toggleDisplayPreview();
                        this.toggleDisplayEditor();
                    },
                    
                    /**
                     * 切换显示/隐藏生成器
                     */
                    toggleDisplayGenerator () {
                        this.$refs.generator.isDisplay = !this.$refs.generator.isDisplay;
                    },
                    
                    /**
                     * 切换显示/隐藏编辑器
                     */
                    toggleDisplayEditor () {
                        this.$refs.editor.isDisplay = !this.$refs.editor.isDisplay;
                    },
                    
                    /**
                     * 切换显示/隐藏预览
                     */
                    toggleDisplayPreview () {
                        this.$refs.preview.isDisplay = !this.$refs.preview.isDisplay;
                    }
                }
            });

            // onInitComplete hook
            if ($.isFunction(settings.onInitComplete)) {
                settings.onInitComplete.call(this);
            }
        });
    },

    // 显示
    show () {
        return this.each(function(){
            this.vm.isDisplay = true;
        });
    },

    // 隐藏
    hide () {
        return this.each(function(){
            this.vm.isDisplay = false;
        });
    },

    // 加载合同
    load (contract) {
        if (typeof contract == 'string') {
            contract = JSON.parse(contract);
        }

        return this.each(function(){
            this.vm.loadContract(contract);
        });
    }
}

// 合同生成器
$.fn.contractGenerator = function(methodOrOptions) {
    if ( methods[ methodOrOptions ] ) {
        return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
        return methods.init.apply( this, arguments );
    } else {
        $.error( '方法 ' +  methodOrOptions + ' 不存在于 tml.contractGenerator' );
    }
};

// 插件默认配置
$.fn.contractGenerator.defaults = defaultConfig;
