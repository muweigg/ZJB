// import components
import commonDialog from '../../components/common-dialog';
import vScrollbar from '../../components/v-scrollbar/v-scrollbar';
import cgSlide from '../../components/cg-slide';

// import service
import CGService from '../../services/CGService';

// import tool libs
import _, { find, sortBy, defer } from 'lodash';

export default {
    name: 'generator',
    props: ['settings'],
    data () {
        return {
            // 是否显示组件
            isDisplay: true,
            // 是否制作向导模式
            isMakeGuide: false,
            // 向导于当前第几步
            guideStep: 1,
            // 全选
            allSelected: false,
            // 指定动画 class
            transitionName: 'fade-in-left',

            // 合同领域，类型数据
            $field: null,
            $category: null,
            $categoryList: null,
            fieldData: [],
            categoryData: [],
            // 合同大纲数据
            selectedOutlineIds: [],
            outlineData: [],
            // 合同数据
            contract: CGService.getEmptyContract()
        }
    },
    components: {
        commonDialog, vScrollbar, cgSlide
    },
    /*created () {
        this.getFieldData();
    },*/
    methods: {

        /**
         * 获取领域数据
         */
        getFieldData () {
            let component = this.$refs.field;
            component.loading = true;

            CGService.getFieldData()
                .then(fieldData => {
                    this.fieldData = fieldData;
                    component.loading = false;
                })
                .catch(repData => {
                    this.$refs.dialog.alert('获取数据失败，点击 "确认" 重新获取...', () => {
                        this.getFieldData();
                    })
                });
        },

        /**
         * 获取类别数据
         */
        getCategoryData () {
            let component = this.$refs.category;
            component.loading = true;

            CGService.getCategoryData(this.contract.field.id)
                .then(repData => {
                    this.$data.$categoryList = repData;
                    this.categoryData = repData;
                    component.loading = false;
                })
                .catch(repData => {
                    this.$refs.dialog.alert('获取数据失败，点击 "确认" 重新获取...', () => {
                        this.getCategoryData();
                    })
                });
        },

        /**
         * 获取大纲数据
         */
        getOutlineData () {
            this.outlineData = [];

            CGService.getOutlineData(this.contract.category.id)
                .then(repData => {
                    this.outlineData = repData;
                })
                .catch(repData => {
                    this.$refs.dialog.alert('获取数据失败，点击 "确认" 重新获取...', () => {
                        this.getOutlineData();
                    })
                });
        },
        
        /**
         * 重置滚动条
         */
        resetScrollbar () {
            this.$nextTick(() => {
                if (document.createEvent) {
                    let event = document.createEvent("HTMLEvents");
                    event.initEvent("resize", true, true);
                    window.dispatchEvent(event);
                } else if (document.createEventObject){
                    window.fireEvent("onresize");
                }
            });
        },

        /**
         * 验证是否有勾选大纲
         *
         * @returns Boolean
         */
        selectedOutlineValid () {
            let valid = this.guideStep === 2 && this.selectedOutlineIds.length === 0;
            if (valid)
                this.$refs.dialog.alert('<span class="error">请选择大纲</span>');
            return valid;
        },

        /**
         * 验证是否输入了合同名称
         *
         * @returns Boolean
         */
        contractNameValid () {
            let valid = this.guideStep === 3 && $.trim(this.contract.name).length === 0;
            if (valid)
                this.$refs.dialog.alert('<span class="error">请输入合同名称</span>',
                    () => document.querySelector('#contractName').focus());
            return valid;
        },

        /**
         * 创建合同
         */
        createContract () {
            this.contract = CGService.getEmptyContract();
            // this.$emit('sync-contract', this.contract);
            this.isMakeGuide = !this.isMakeGuide;
            this.allSelected = false;
            this.fieldData = [];
            this.categoryData = [];
            this.selectedOutlineIds = [];

            /*if (this.$data.$field) {
                this.selectedField(this.$data.$field.id);
                // this.selectedCategory(this.$data.$category.id);
            }*/
            
            this.$refs.field.loading = true;
            this.$refs.category.loading = true;
            this.getFieldData();
        },
        
        /**
         * 返回初始
         */
        back () {
            this.transitionName = 'fade-in-left';
            this.isMakeGuide = false;
        },
        
        /**
         * 向导下一步
         */
        nextStep () {
            this.transitionName = 'fade-in-left';
            if (this.guideStep === 3) return;
            if (this.selectedOutlineValid()) return;
            this.guideStep++;
            this.resetScrollbar();
        },
        
        /**
         * 向导上一步
         */
        prevStep () {
            this.transitionName = 'fade-in-right';
            this.guideStep--;
            this.resetScrollbar();
        },

        /**
         * 全选
         */
        allSelect () {
            _.defer(() => {
                this.selectedOutlineIds = [];
                if (this.allSelected) {
                    for (let outline of this.outlineData) {
                        this.selectedOutlineIds.push(outline.id);
                    }
                }
            });
        },
        
        /**
         * 开始制作编辑合同
         */
        startEdit () {
            if (this.contractNameValid()) return;
            this.$emit('start-edit', this.contract);
        },
        
        /**
         * 选中领域后触发的事件
         * 
         * @param {Number} id
         */
        selectedField (id) {
            this.$data.$field = _.find(this.fieldData, {id: id});
            // this.$data.$categoryList = this.$data.$field.catename;
            // this.categoryData = this.$data.$field.catename;
            this.contract.field.id = this.$data.$field.id;
            this.contract.field.pid = this.$data.$field.pid;
            this.contract.field.name = this.$data.$field.name;

            this.categoryData = [];
            this.getCategoryData();
        },
        
        /**
         * 选中类别后触发的事件
         * 
         * @param {Number} id
         */
        selectedCategory (id) {
            this.selectedOutlineIds = [];
            this.$data.$category = _.find(this.$data.$categoryList, {id: id});
            // this.outlineData = this.$data.$category.outline || [];

            this.contract.category.id = this.$data.$category.id;
            this.contract.category.pid = this.$data.$category.pid;
            this.contract.category.name = this.$data.$category.name;
            // this.contract.duction = this.$data.$category.duction;

            this.outlineData = [];
            this.allSelected = false;
            this.getOutlineData();
        },
        
        /**
         * 导入合同
         * 
         * @param {Object} contract
         */
        loadContract () {
            
            // onImport hook
            if ($.isFunction(this.settings.onImport)) {
                this.settings.onImport();
            }
        }
    },
    watch: {
        
        /**
         * 勾选大纲数据后触发的事件
         */
        selectedOutlineIds () {
            this.contract.outline = [];
            for (let id of this.selectedOutlineIds) {
                this.contract.outline.push(_.find(this.outlineData, {id: id}));
            }
            this.contract.outline = _.sortBy(this.contract.outline, 'sortBy');
        },
        guideStep (val) {
            if (val === 3)
                this.$nextTick(() => this.$refs.contractName.focus());
        }
    }
}