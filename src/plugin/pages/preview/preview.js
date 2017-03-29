// import templates
import template from './preview.html';

// import components
import vScrollbar from '../../components/v-scrollbar/v-scrollbar';

// import service
import CGService from '../../services/CGService';

import iEditor from '../../libs/iEditor';

export default {
    name: 'preview',
    props: ['settings'],
    data () {
        return {
            isDisplay: false,

            // 合同数据
            contract: CGService.getEmptyContract()
        }
    },
    template,
    components: { vScrollbar },
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
         * 编辑器模式
         */
        editorMode () {
            this.$emit('editor-mode');
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
        }
    },
    watch: {

        /**
         * 监视组件显示属性，重置滚动条
         * 
         * @param {Boolean} val
         */
        isDisplay (val) {
            if (val) {
                this.resetScrollbar();
                this.$nextTick(() => {
                    new iEditor(document.querySelector('.preview-body-wrap'));
                });
            }
        }
    }
}