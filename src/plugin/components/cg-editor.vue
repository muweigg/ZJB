<template>
<div :contenteditable="isEditable" ref="editor" :id="outline.id"
    :data-placeholder="placeholder" :class="{duction: outline.subsidiary == 0}"
    @click.stop
>
</div>
</template>

<script>
import iEditor from '../libs/iEditor';
import _, { filter, defer } from 'lodash';

export default {
    name: 'cg-editor',
    props: {
        outline: {
            type: Object,
            required: true
        },
        placeholder: {
            type: String,
            default: '请输入内容'
        },
        isEditable: {
            type: Boolean,
            default: true
        }
    },
    data () {
        return {
            inputText: '',
            node: null,
            $iEditor: null
        }
    },
    mounted () {
        if (this.outline) {
            this.$refs.editor.innerHTML = this.outline.content || '';
            this.$data.$iEditor = new iEditor(this.$refs.editor);
            this.syncData();
        }
    },
    beforeDestroy () {
        this.$data.$iEditor.destroyEditor();
    },
    methods: {
        
        /**
         * 同步编辑器数据
         */
        syncData () {
            let content = this.$refs.editor.innerHTML;
            this.outline.content = content.replace(/class="focus"/ig, '');
        },

        /**
         * 同步视图
         */
        syncView () {
            this.$refs.editor.innerHTML = this.outline.content || '';
        }
    }
}
</script>

<style lang="sass">
[tml-cg] [contenteditable] {
    border: 1px dashed transparent;
    border-radius: 5px;
    padding: 5px 10px;
    outline: none;
    margin-bottom: 10px;
    font-size: 14px;
    line-height: 1.8;
    // min-height: 57px;
    word-wrap: break-word;

    &.active, &:hover {
        // border: 1px dashed #868686;
    }

    &:nth-of-type(1) {
        margin-top: 20px;
    }

    &.empty:before {
        content: attr(data-placeholder);
        position: absolute;
        margin-left: 5px;
        pointer-events: none;
        opacity: .5;
    }

    p, div, li {
        padding: 0 5px;
        border-radius: 3px;

        /*&:hover {
            background-color: rgba(207,207,207, .3);
        }*/
        border: 1px dashed transparent;

        &.focus {
            border: 1px dashed #868686;
        }
    }

    ol, ol ol {
        // padding-left: 50px;
        list-style-type: none;
    }

    ol {
        // add
        padding-left: 45px;

        > li {
            counter-increment: step-counter-1;

            &:before {
                content: attr(data-symbol-before)counter(step-counter-1)attr(data-symbol-after);
                display: inline-block;
                // margin: 0 10px 0 0;
                text-align: right;
                // add
                // float: left;
                margin: 0 10px 0 -45px;
                width: 35px;
            }

        }

        > ol {
            padding-left: 35px;

            > li {
                counter-increment: step-counter-2;

                &:before {
                    content: attr(data-symbol-before)counter(step-counter-2)attr(data-symbol-after);
                    display: inline-block;
                    margin: 0 10px 0 0;
                    text-align: right;
                    // add
                    // float: left;
                    margin: 0 10px 0 -45px;
                    width: 35px;
                }

            }

            > ol {
                padding-left: 45px;

                > li {
                    counter-increment: step-counter-3;

                    &:before {
                        content: attr(data-symbol-before)counter(step-counter-2)'.'counter(step-counter-3)attr(data-symbol-after);
                        display: inline-block;
                        margin: 0 10px 0 0;
                        text-align: right;
                        // add
                        // float: left;
                        margin: 0 10px 0 -45px;
                        width: 35px;
                    }

                }
            }
        }
    }

    &.duction {

        > ol {
            padding: 0;

            > li:before {
                display: none;
            }
        }
    }
}
</style>