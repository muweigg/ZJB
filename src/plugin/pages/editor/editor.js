// import components
import commonDialog from '../../components/common-dialog';
import vScrollbar from '../../components/v-scrollbar/v-scrollbar';
import cgPopupMenu from '../../components/cg-popup-menu';
import cgEditor from '../../components/cg-editor';

// import service
import CGService from '../../services/CGService';

// import tool libs
import _, { differenceWith, cloneDeep, find, isArray, sortBy, trim, debounce, defer, delay } from 'lodash';

// import jquery libs
// import 'script-loader!../../libs/jquery.caret.min';

export default {
    name: 'editor',
    props: ['settings'],
    data () {
        return {
            $bgColor: ['c1', 'c2', 'c3', 'c4'],

            // 清除定时器ID
            $clearId: 0,

            // 当前选中的节点
            currentNode: {},

            // 当前合同领域
            field: null,

            // 当前合同类别
            category: null,

            // 当前节点类型
            $subsidiary: undefined,

            // 当前节点父级 ID
            $parentid: undefined,

            // 当前节点 ID
            $contentid: undefined,

            // 输入文本用于获取推荐
            $inputText: undefined,

            // 是否显示组件
            isDisplay: false,

            // 是否输入中
            typeing: false,

            // 是否加载数据中
            loading: false,

            // 当前激活的 Tab 选项卡
            activeTab: 2,

            // 当前选中段落
            selectedParagraph: null,
            selectedParagraphTmp: null,

            // 弹出菜单组件显示位置
            posLeft: {
                top: 0,
                left: 0
            },

            /*posRight: {
                top: 0,
                left: 0
            },*/

            // 菜单显示的项
            showItems: 0,

            // 用于粘贴的元素
            pasteEl: '',

            // 大纲列表
            outlineList: null,

            // 撤销导航
            undoNav: [],

            // 恢复导航
            redoNav: [],

            // 合同数据
            contract: CGService.getEmptyContract(),

            // 推荐数据
            recommendData: [],

            // 是否已加锁（不予请求推荐数据）
            isLocked: false,

            // 是否包含引言
            isContainIntroduction: false,

            editor: null,
            editorEl: null,
            editorVM: null
        }
    },
    components: {
        commonDialog, vScrollbar, cgPopupMenu, cgEditor
    },
    methods: {

        /**
         * 重置滚动条
         */
        resetScrollbar () {
            this.$nextTick(() => {
                if (document.createEvent) {
                    let event = document.createEvent("HTMLEvents");
                    event.initEvent("resize", true, true);
                    window.dispatchEvent(event);
                } else if (document.createEventObject) {
                    window.fireEvent("onresize");
                }
            });
        },

        /**
         * 重置段落（移除效果及引用）
         */
        resetSelectedParagraph () {
            if (this.selectedParagraph) {
                this.editorEl.classList.remove('active');
                this.selectedParagraph.classList.remove('focus');
                this.selectedParagraph = null;
                this.editorEl = null;
                this.editorVM = null;
                this.editor = null;
            }
        },
        
        /**
         * 编辑器键盘按下后触发的重置事件
         */
        reset () {
            this.resetScrollbar();
            this.$refs.popupLeft.isDisplay = false;
        },
        
        /**
         * 切换'条款信息','目录大纲'的选项卡
         * 
         * @param {Number} idx
         */
        toggleTab (idx) {
            this.activeTab = idx;
            this.resetScrollbar();
        },

        /**
         * 切换锁状态
         */
        toggleLock () {
            this.isLocked = !this.isLocked;
        },

        /**
         * 点击编辑器页面范围触发一系列动作
         */
        someActions () {
            this.resetSelectedParagraph();
            this.$refs.popupLeft.isDisplay = false;
            // this.$refs.popupRight.isDisplay = false;
            this.currentNode = {};
        },

        /**
         * 获取索引对应的样式类
         * 
         * @param {Number} idx
         * @returns String
         */
        getClass (idx) {
            let len = this.$data.$bgColor.length;
            return this.$data.$bgColor[idx % len];
        },

        /**
         * 同步视图数据（撤销/恢复）
         */
        syncView () {
            if (!this.$refs.editors) return;
            for (let editor of this.$refs.editors) {
                editor.syncView();
                editor.$data.$iEditor.checkFormatSymbol();
                editor.$data.$iEditor.isEmpty();
            }
        },

        /**
         * 同步输入数据
         */
        syncData () {
            this.editorVM.syncData();
        },

        /**
         * 放入撤销导航
         */
        pushUndoNav () {
            this.undoNav.push(_.cloneDeep(this.contract.outline));
        },

        /**
         * 放入恢复导航
         *
         * @param {Object} outline
         */
        pushRedoNav (outline) {
            this.redoNav.push(_.cloneDeep(outline));
        },

        /**
         * 清空恢复记录
         */
        clearRedoNav () {
            this.redoNav = [];
        },

        /**
         * 撤销
         */
        undo () {
            this.pushRedoNav(_.cloneDeep(this.contract.outline));
            this.contract.outline = this.undoNav.pop();
            this.$nextTick(() => this.syncView());
        },

        /**
         * 恢复
         */
        redo () {
            this.pushUndoNav(_.cloneDeep(this.contract.outline));
            this.contract.outline =  this.redoNav.pop();
            this.$nextTick(() => this.syncView());
        },

        toggleSelected (idx, e) {
            if (e.type === 'mousedown' && e.buttons === 2)
                document.oncontextmenu = () => false;

            _.delay(() => {

                if (this.selectedParagraph && this.editorVM !== this.$refs.editors[idx])
                    this.selectedParagraph.classList.remove('focus');

                this.editorVM = this.$refs.editors[idx];
                this.editor = this.editorVM.$data.$iEditor;
                this.editorEl = this.editor.editor;

                this.selectedParagraph = this.editor.focusNode;
                this.selectedParagraphTmp = this.editor.focusNode;

                this.currentNode = this.editorVM.outline;

                if (e.type === 'mousedown' && e.buttons === 2) {
                    this.popupMenu({x: e.pageX, y: e.pageY});
                    return;
                }

                if (_.trim(this.selectedParagraph.textContent) === '')
                    this.inputDataProcess();
            }, 10);
        },

        inputKeyFilter (e) {
            let isFilter = false,
                keyDict = {
                    '9': true,
                    '12': true,
                    '16': true,
                    '17': true,
                    '18': true,
                    '19': true,
                    '20': true,
                    '33': true,
                    '34': true,
                    '35': true,
                    '36': true,
                    '41': true,
                    '42': true,
                    '43': true,
                    '44': true,
                    '45': true,
                    '47': true,
                    '91': true,
                    '92': true,
                    '93': true,
                    '95': true,
                    '106': true,
                    '107': true,
                    '108': true,
                    '109': true,
                    '110': true,
                    '111': true,
                    '112': true,
                    '113': true,
                    '114': true,
                    '115': true,
                    '116': true,
                    '117': true,
                    '118': true,
                    '119': true,
                    '120': true,
                    '121': true,
                    '122': true,
                    '123': true,
                    '124': true,
                    '125': true,
                    '126': true,
                    '127': true,
                    '144': true,
                    '145': true,
                    '160': true,
                    '161': true,
                    '162': true,
                    '163': true,
                    '164': true,
                    '165': true
                };
            if (!e) return isFilter;
            if (keyDict[e.keyCode]
                || e.ctrlKey && keyDict[e.keyCode]
                || e.ctrlKey && e.keyCode === 67
                || e.shiftKey && keyDict[e.keyCode]
                || e.altKey && keyDict[e.keyCode]
                || e.metaKey && keyDict[e.keyCode])
                isFilter = true;
            return isFilter;
        },

        /**
         * 输入数据处理
         */
        inputDataProcess (e) {
            this.reset();
            this.syncData();
            if (this.isLocked) return;
            if (this.inputKeyFilter(e)) return;
            _.delay(() => {
                let text = this.editor.nodeText.content,
                node = this.editor.focusNode;

                this.typeing = true;
                this.activeTab = 1;

                this.$data.$inputText = text.replace(/&nbsp;/ig, '');
                this.$data.$parentid = node.get('pid');
                this.$data.$contentid = node.id;
                this.$data.$subsidiary = node.get('subsidiary');
                
                this.getRecommendDataByInputText();
            }, 10);
        },

        getFrontNodeText (node, ids = new Set(), isFront = true, splitText = '', text = '') {
            if (node) {
                if (isFront)
                    text = this.getFrontNodeText(node.previousSibling, ids, isFront, splitText, text);
                else 
                    text = this.getFrontNodeText(node.nextSibling, ids, isFront, splitText, text);
            } else {
                return text;
            }

            if (node.nodeType === 1) {
                text = node.textContent + splitText + text;
                if (node.id) {
                    ids.add(node.id);
                }
            }

            return text;
        },

        /**
         * 根据输入文本获取推荐数据
         */
        getRecommendDataByInputText () {
            this.loading = true;

            if (!this.$data.$debounced) {
                this.$data.$debounced = _.debounce(() => {

                    let nexttext = '', otherlist = '', nextidlist = new Set(),
                    node = this.selectedParagraphTmp;
                    
                    if (_.trim(this.$data.$inputText) === '') {
                        nexttext = this.getFrontNodeText(node.previousSibling, nextidlist);
                        nexttext += this.getFrontNodeText(node.nextSibling, nextidlist, false);
                    };

                    otherlist = this.getFrontNodeText(node.previousSibling, nextidlist, true, '###');
                    otherlist += this.getFrontNodeText(node.nextSibling, nextidlist, false, '###');

                    let params = {
                        text: this.$data.$inputText,
                        cateid: this.contract.category.id,
                        typeid: this.contract.field.id,
                        parentid: this.$data.$parentid,
                        contentid: this.$data.$contentid,
                        subsidiary: this.$data.$subsidiary,
                        nexttext: nexttext,
                        otherlist: otherlist,
                        nextidlist: [...nextidlist]
                    }

                    CGService.getRecommendData(params).then(
                        repData => {
                            // console.log('success', repData);
                            this.typeing = false;
                            this.loading = false;
                            this.recommendData = repData;
                            // this.resetScrollbar();
                        },
                        errData => {
                            // console.log('fail', errData);
                            this.typeing = false;
                            this.loading = false;
                        }
                    );
                }, 1000);
            }

            this.$data.$debounced(); 
        },
        
        /**
         * 弹出菜单
         *
         * @param {Object} pos
         */
        popupMenu (pos) {
            this.posLeft.top = pos.y;
            this.posLeft.left = pos.x;
            this.$refs.popupLeft.isDisplay = true;

            let subsidiary = parseInt(this.selectedParagraph.get('subsidiary'));
            this.showItems = 0;
            if (this.editor.upgradeEls.length !== 0) {
                this.showItems += 1;
            } else if (subsidiary === 3) {
                this.showItems += 1;
                this.editor.upgradeEls = [this.selectedParagraph];
            }

            if (this.editor.downgradeEls.length !== 0) {
                this.showItems += 2;
            } else if (subsidiary === 2) {
                this.showItems += 2;
                this.editor.downgradeEls = [this.selectedParagraph];
            }

            this.showItems += subsidiary === 2 ? 4 : 0;
        },

        /**
         * 复制段落
         */
        copyParagraphText () {
            this.pasteEl = this.selectedParagraph;
        },

        /**
         * 粘贴段落文本
         */
        pasteParagraphText () {
            this.pushUndoNav();
            
            this.selectedParagraph.id = this.pasteEl.id;
            this.selectedParagraph.innerHTML = this.pasteEl.innerHTML;
            this.syncData();
            this.resetScrollbar();
            this.clearRedoNav();
            this.editor.isEmpty();
        },

        /**
         * 删除段落
         */
        delParagraph () {
            this.pushUndoNav();

            this.$refs.dialog.confirm('确认删除本段？', () => {
                this.selectedParagraph.parentNode.removeChild(this.selectedParagraph);
                this.selectedParagraph = null;
                this.syncData();
                this.resetScrollbar();
                this.clearRedoNav();
                this.editor.isEmpty();
            });
        },

        /**
         * 添加款
         */
        addParagraph () {
            this.editor.insertParagraph();
        },

        /**
         * 添加项
         */
        addSubParagraph () {
            this.editor.insertSubParagraph();
        },


        /**
         * 升级
         */
        upgrade () {
            this.pushUndoNav();

            this.editor.upgrade();
            this.syncData();
            this.resetScrollbar();
            this.clearRedoNav();
        },


        /**
         * 降级
         */
        downgrade () {
            this.pushUndoNav();

            this.editor.downgrade();
            this.syncData();
            this.resetScrollbar();
            this.clearRedoNav();
        },

        /**
         * 为元素添加符号
         *
         * @param {Node} node
         * @param {Array} symbol
         */
        /*addSymbol (node, symbol) {
            if (symbol.length >= 2) {
                node.set('symbol-before', symbol[0])
                    .set('symbol-after', symbol[1]);
            } else {
                node.set('symbol-before', '')
                    .set('symbol-after', symbol[0]);
            }
        },*/

        /**
         * 将推荐插入段落
         *
         * @param {Object} recommend
         */
        deleteRecommend (recommend, idx) {
            this.$delete(this.recommendData, idx);
            CGService.delRecommend(recommend).then(
                repData => {},
                errData => console.log(errData));
        },

        /**
         * 将推荐插入段落
         *
         * @param {Object} recommend
         */
        insertParagraph (recommend) {
            this.pushUndoNav();

            let clone = this.selectedParagraph.cloneNode(true);
            clone.id = recommend.id;
            clone.innerHTML = recommend.content;
            clone.classList.remove('focus');
            $(clone).insertAfter(this.selectedParagraph);
            this.syncData();
            this.resetScrollbar();
            this.clearRedoNav();
        },

        /**
         * 将推荐替换段落
         *
         * @param {Object} recommend
         */
        replaceParagraph (recommend) {
            this.pushUndoNav();

            this.selectedParagraph.id = recommend.id;
            this.selectedParagraph.innerHTML = recommend.content;
            this.editor.setCaret(this.selectedParagraph, false);
            this.syncData();
            this.resetScrollbar();
            this.clearRedoNav();
            // this.$refs.popupLeft.isDisplay = false;
        },

        /**
         * 删除合同中一条大纲数据
         * 
         * @param {Object} outline
         */
        delOutline (idx) {
            this.$refs.dialog.confirm('确认删除？', () => {
                this.pushUndoNav();

                this.contract.outline.splice(idx, 1);
                this.resetScrollbar();
                this.clearRedoNav();
            });
        },

        /**
         * 添加大纲
         *
         * @param {Number} idx
         */
        addOutline (idx) {
            this.pushUndoNav();

            let outline = _.cloneDeep(this.outlineList[idx]);
            this.contract.outline.push(outline);
            this.contract.outline = _.sortBy(this.contract.outline, 'sortBy');
            this.resetScrollbar();
            this.clearRedoNav();
        },

        /**
         * 生成器模式
         */
        generatorMode () {
            this.$refs.dialog.confirm('<span class="error">确认放弃当前编辑进度关闭返回吗？</span>', () => {
                this.$emit('generator-mode');
            });
        },

        /**
         * 导入合同数据
         */
        importContract () {
            // onImport hook
            if ($.isFunction(this.settings.onImport)) {
                this.settings.onImport();
            }
        },

        /**
         * 导出合同数据
         */
        exportContract () {
            // onExport hook
            if ($.isFunction(this.settings.onExport)) {
                this.settings.onExport(JSON.stringify(this.contract));
            }
        },

        /**
         * 保存
         */
        saveContract () {
            CGService.save(this.contract).then(() => {
                // onSave hook
                if ($.isFunction(this.settings.onSave)) {
                    this.settings.onSave(this.contract);
                }
            });
        },

        /**
         * 预览合同
         */
        preview () {
            this.$emit('preview', this.contract);
        },

        /**
         * 跳转到对应的大纲
         */
        jumpTo (outline) {
            let container = $('.contract-body'), target = null,
                contractBody = this.$refs.contractBody;
            if (outline.subsidiary !== 0)
                target = container.find(`h3#${outline.id}`);
            else target = container.find(`div#${outline.id}`);

            let pos = target.position();
            if (pos) {
                let top = contractBody.top + pos.top,
                    offsetTop = contractBody.scrollContentHeight - top;

                if (offsetTop < contractBody.scrollContainerHeight) {
                    top -= contractBody.scrollContainerHeight - offsetTop;
                }

                // this.$refs.contractBody.top = top;
                this.$refs.contractBody.normalizeVertical(top);
            }
        }
    },
    watch: {

        /**
         * 监视组件显示属性，重置滚动条
         * 
         * @param {Boolean} val
         */
        /*isDisplay (val) {
            if (val) {
                this.$nextTick(() => {
                    this.syncView();
                    this.resetScrollbar();
                });
            }
        },*/
        contract () {
            this.isContainIntroduction = false;
            let has = _.find(this.contract.outline, ['subsidiary', 0]);
            if (has) this.isContainIntroduction = true;
        },
        'contract.outline.length' () {
            if (this.contract.outline.length !== 0) {
                _.differenceWith(this.outlineList, this.contract.outline,
                    (value, other) => {
                        if (other && value.id === other.id) {
                            value.isDifference = false;
                            return true;
                        } else {
                            value.isDifference = true;
                        }
                    }
                );
            } else {
                let outline = _.find(this.outlineList, ['isDifference', false]);
                if (outline)
                    outline.isDifference = true;
            }
        },
        category () {
            this.$data.$inputText = this.contract.field.name;
            this.$data.$parentid = '';
            this.$data.$contentid = '';
            this.$data.$subsidiary = '';
            this.getRecommendDataByInputText();
        }
    }
}