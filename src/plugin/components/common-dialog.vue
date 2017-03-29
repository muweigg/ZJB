<template>
    <div class="dialog" v-if="isOpen">
        <div class="dialog_wrap">
            <a href="javascript:" class="icon icon-dialog-close" @mousedown.stop="close"></a>
            <div class="title"> {{ title }} </div>
            <div class="content" v-html="content"></div>
            <div class="buttons">
                <button v-if="isConfirm" @mousedown.stop="close" class="double">取消</button>
                <button v-else @mousedown.stop="ok" class="single">确认</button>
                <button v-if="isConfirm" @mousedown.stop="ok" class="double">确认</button>
            </div>
        </div>
        <div class="dialog_mask" @mousedown.stop="close"></div>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                isOpen: false,
                isConfirm: false,
                callback: null,
                title: "信息提示",
                content: ""
            };
        },
        methods: {
            ok () {
                if (typeof this.callback == "function") {
                    this.callback();
                }
                this.close();
            },
            close () {
                this.isOpen = false;
                this.isConfirm = false;
                this.callback = null;
                this.content = "";
            },
            alert (msg, func) {
                this.content = msg;
                this.callback = func;
                this.isOpen = true;
            },
            confirm (msg, func) {
                this.content = msg;
                this.callback = func;
                this.isOpen = this.isConfirm = true;
            }
        }
    };
</script>

<style lang="sass">
    $zIndex: 20;
    [tml-cg] .dialog {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: $zIndex;

        div.dialog_mask {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: $zIndex;
            background-color: #000;
            opacity: .5;
        }

        .dialog_wrap {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: $zIndex + 1;
            background-color: #fff;
            width: 346px;
            min-height: 182px;
            border-radius: 10px;
            box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);
            padding-bottom: 52px;
            overflow: hidden;

            a {
                position: absolute;
                top: 12px;
                right: 12px;
                z-index: $zIndex + 2;
            }

            .title {
                margin-top: 30px;
                // height: 40px;
                // line-height: 40px;
                text-align: center;
                font-size: 22px;
                color: #2a2a2a;
            }

            .content {
                padding: 10px;
                text-align: center;
                font-size: 14px;
                color: #4d4c4c;

                .error {
                    color: red;
                }
            }

            .buttons {
                position: absolute;
                bottom: 0;
                right: 0;
                left: 0;

                &:after {
                    content: ' ';
                    display: block;
                    clear: both;
                }

                button {
                    height: 52px;
                    line-height: 1;
                    text-align: center;
                    color: #454545;
                    font-size: 18px;
                    font-family: "Microsoft YaHei";
                    cursor: pointer;
                    border: 0;
                    border-top: 1px solid #dadada;
                    background-color: transparent;
                    float: left;

                    &.single {
                        width: 100%;
                        color: #e23734;
                    }
                    
                    &.double {
                        width: 50%;

                        &:nth-last-of-type(1) {
                            color: #e23734;
                            border-left: 1px solid #dadada;
                        }
                    }
                }
            }
        }
    }
</style>