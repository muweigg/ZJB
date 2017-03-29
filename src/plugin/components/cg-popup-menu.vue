<template>
    <div class="popup-menu" v-show="isDisplay"
        :style="{
            top: pos.top + 'px',
            left: pos.left + 'px'
        }"
        @mouseleave="leave">
        <div class="popup-menu-wrap">
            <template v-if="menuType === 1">
                <button @mousedown.stop="copy($event)" :disabled="!selectedParagraph">
                    <i class="icon icon-copy"></i>
                    复制本段
                </button>
                <button @mousedown.stop="paste($event)" :disabled="!selectedParagraph || !pasteEl">
                    <i class="icon icon-paste"></i>
                    粘贴
                </button>
                <button @mousedown.stop="del($event)" :disabled="!selectedParagraph">
                    <i class="icon icon-delete"></i>
                    删除本段
                </button>
                <button @mousedown.stop="add($event)">
                    <i class="icon icon-add-paragraph"></i>
                    添加款
                </button>
                <button @mousedown.stop="addSub($event)" :disabled="!(showItems & 4)">
                    <i class="icon icon-add-subparagraph"></i>
                    添加项
                </button>
                <button @mousedown.stop="upgrade($event)" :disabled="!(showItems & 1)">
                    <i class="icon icon-upgrade"></i>
                    上升为款
                </button>
                <button @mousedown.stop="downgrade($event)" :disabled="!(showItems & 2)">
                    <i class="icon icon-downgrade"></i>
                    下降为项
                </button>
            </template>
            <template v-else>
            </template>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'cg-popup-menu',
        data () {
            return {

                // 是否显示弹出菜单
                isDisplay: false,
                isUpgrade: false,
                isDowngrade: false
            }
        },
        props: {
            pos: {
                type: Object,
                default: {
                    top: 0,
                    left: 0
                },
                required: true
            },
            pasteEl: {
                type: Object,
                default: '',
                required: true
            },
            menuType: {
                type: Number,
                default: 1
            },
            showItems: {
                type: Number,
                default: 0
            },
            selectedParagraph: {
                type: Object,
                default: null,
                required: true
            }
        },
        methods: {
            copy (e) {
                e.preventDefault();
                this.isDisplay = false;
                this.$emit('copy');
            },
            
            paste (e) {
                e.preventDefault();
                this.isDisplay = false;
                this.$emit('paste');
            },
            
            del (e) {
                e.preventDefault();
                this.isDisplay = false;
                this.$emit('del');
            },

            add (e) {
                e.preventDefault();
                this.isDisplay = false;
                this.$emit('add');
            },
            
            addSub (e) {
                e.preventDefault();
                this.isDisplay = false;
                this.$emit('add-sub');
            },

            upgrade (e) {
                e.preventDefault();
                this.isDisplay = false;
                this.$emit('upgrade');
            },

            downgrade (e) {
                e.preventDefault();
                this.isDisplay = false;
                this.$emit('downgrade');
            },

            leave (e) {
                document.oncontextmenu = () => true;
                this.isDisplay = false;
            }
        },
        watch: {
            isDisplay (val) {
                if (val) {
                    let w = window.innerWidth, h = window.innerHeight,
                        top = this.pos.top + 226, left = this.pos.left - 124 / 2;
                    if (top > h) {
                        this.pos.top -= top - h;
                    }
                    if (left < 0) {
                        this.pos.left += Math.abs(left) + 10;
                    }
                    if (left > w) {
                        this.pos.left -= left - w + 10;
                    }
                }
            }
        }
    }
</script>

<style lang="sass" scoped>
    @import '../scss/common.scss';
    [tml-cg] .popup-menu {
        width: 0;
        height: 0;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 15;
        user-select: none;
        cursor: default;
        font-size: 0;

        .popup-menu-wrap {
            width: 124px;
            height: 226px;
            padding: 8px 0;
            position: absolute;
            // white-space: nowrap;
            background-color: #fff;
            // border: 1px solid #b9b9b9;
            border-radius: 5px;
            box-shadow: 0 1px 10px rgba(166, 166, 166, .5);
            transform: translate(-50%, -20px);
            background-color: #fff;

            button {
                width: 100%;
                padding: 0 0 0 18px;
                height: 30px;
                line-height: 1;
                color: #141414;
                border: 0;
                background-color: transparent;
                font-size: 14px;
                cursor: pointer;
                text-align: left;

                i {
                    margin-right: 5px;
                }

                &[disabled] {
                    opacity: .3;
                }

                &:hover {
                    color: #18b8fa;
                    background-color: #f4f4f4;

                    &:nth-of-type(3) {
                        color: #e23734;
                    }

                    .icon-copy {
                        @include sprite($copy-hover);
                    }

                    .icon-paste {
                        @include sprite($paste-hover);
                    }

                    .icon-delete {
                        @include sprite($delete-hover);
                    }

                    .icon-add-paragraph {
                        @include sprite($add-paragraph-hover);
                    }

                    .icon-add-subparagraph {
                        @include sprite($add-subparagraph-hover);
                    }

                    .icon-upgrade {
                        @include sprite($upgrade-hover);
                    }

                    .icon-downgrade {
                        @include sprite($downgrade-hover);
                    }
                }
            }
        }

        &.right {

            .popup-menu-wrap {
                background-color: #ff7f00;
                border-color: #ff7f00;

                &:after,
                &:before {
                    border-top-color: #ff7f00;
                }

                button {
                    color: #fff;
                    border-left-color: #fff;

                    &[disabled] {
                        opacity: .7;
                    }
                }
            }
            
        }
    }
</style>