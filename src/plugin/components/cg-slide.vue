<template>
    <div class="cg-slide-container"
            :style="'height:' + height + 'px;'">
    
        <span class="arrow prev"
            @click="prev"
            :class="{ disable: activeSlide === 1 }"></span>

        <span class="arrow next"
            @click="next"
            :class="{ disable: activeSlide >= lastSlide }"></span>

        <div class="cg-slide-wrap"
            :style="'height:' + height + 'px;'">

            <div class="cg-slide clearfix"
                v-for="(chunk, idx) in chunkData"
                :class="{
                    'prev-slide': (idx + 1) < activeSlide,
                    'next-slide': (idx + 1) > activeSlide
                }">
                <label v-for="(data, idx) in chunk" :title="data.name">
                    <input type="radio"
                        :name="name"
                        :value="data.id"
                        v-model="selected">
                    <span>{{ data.name }}</span>
                </label>
            </div>
        </div>
        <div class="loading" v-show="loading">
            <svg width='50px' height='50px' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="uil-default"><rect x="0" y="0" width="100" height="100" fill="none" class="bk"></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(0 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(30 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.08333333333333333s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(60 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.16666666666666666s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(90 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.25s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(120 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.3333333333333333s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(150 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.4166666666666667s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(180 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.5s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(210 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.5833333333333334s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(240 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.6666666666666666s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(270 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.75s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(300 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.8333333333333334s' repeatCount='indefinite'/></rect><rect  x='46' y='40' width='8' height='20' rx='5' ry='5' fill='#b7b7b7' transform='rotate(330 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.9166666666666666s' repeatCount='indefinite'/></rect></svg>
        </div>
    </div>
</template>

<script>
    import _chunk from 'lodash/chunk';

    export default {
        name: 'cg-slide',
        data () {
            return {
                chunkData: [],
                activeSlide: 1,
                lastSlide: 0,
                height: 52,
                selected: null,
                loading: false
            }
        },
        props: [ 'items', 'name', 'line' ],
        mounted () {
            this.height = this.height * this.line + this.line * 10 - 10;
        },
        methods: {
            init () {
                this.selected = null;
                this.activeSlide = 1;
                this.chunkData = _chunk(this.items, this.line * 6);
                this.lastSlide = this.chunkData.length;
                if (this.chunkData.length !== 0)
                    this.selected = this.chunkData[0][0].id;
            },
            prev () {
                if (this.activeSlide === 1) return;
                this.activeSlide--;
            },
            next () {
                if (this.activeSlide >= this.lastSlide) return;
                this.activeSlide++;
            }
        },
        watch: {
            items () {
                this.init();
            },
            selected () {
                if (!this.selected) return;
                this.$emit('selected', this.selected);
            }
        }
    }
</script>

<style lang="sass">
@import '../scss/icons.scss';

// $slideWidth: 382px;
$slideWidth: 100px * 6 - 10px;
$slideHeight: 52px;
$slideArrowMargin: -12px;

.cg-slide-container {
    width: $slideWidth;
    height: $slideHeight;
    margin: 10px auto 0;
    position: relative;

    .arrow {
        position: absolute;
        user-select: none;

        &.prev:after, &.next:after {
            content: " ";
            border: solid transparent;
            height: 0;
            width: 0;
            position: absolute;
            border-color: rgba(0, 0, 0, 0);
            border-width: 10px;
            margin-top: -10px;
            cursor: pointer;
        }

        &.prev {
            top: 50%;
            left: $slideArrowMargin;

            &:after {
                margin-left: -20px;
                border-right-color: #616161;
            }
        }
        
        &.next {
            top: 50%;
            right: $slideArrowMargin;

            &:after {
                border-left-color: #616161;
            }
        }

        &.disable {

            &.prev:after, &.next:after {
                cursor: default;
            }
            
            &.prev:after {
                border-right-color: #b7b7b7;
            }

            &.next:after {
                border-left-color: #b7b7b7;
            }
        }
    }

    .cg-slide-wrap {
        width: $slideWidth;
        height: $slideHeight;
        position: relative;
        overflow: hidden;

        .cg-slide {
            margin: 0 0 -10px -10px;
            background-color: #fff;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            transition: transform 300ms ease-in-out;

            &.prev-slide {
                transform: translateX(-100%);
            }

            &.next-slide {
                transform: translateX(100%);
            }

            label {
                $height: 52px;
                $width: 110px;

                width: $width;
                height: $height;
                float: left;
                margin: 0 0 10px 10px;
                cursor: pointer;

                span {
                    float: left;
                    width: $width;
                    height: $height;
                    // line-height: $height - 2px;
                    // padding: 0 10px;
                    border: 1px solid #868686;
                    border-radius: 3px;
                    font-size: 16px;
                    color: #2d2d2d;
                    overflow: hidden;
                    // text-overflow: ellipsis;
                    // white-space: nowrap;
                    position: relative;

                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    &:before, &:after {
                        content: '';
                        position: absolute;
                        opacity: 0;
                        transition: opacity 100ms ease-in;
                    }

                    &:before {
                        display: block;
                        width: 56px;
                        height: 18px;
                        right: -31px;
                        top: 0;
                        transform: rotate(45deg);
                        background-color: #ff4845;
                    }

                    &:after {
                        @include sprite($checked);
                        top: 3px;
                        right: 2px;
                    }
                }

                [type=radio] {
                    display: none;
                }

                [type=radio]:checked ~ span {
                    border-color: #ff4845;

                    &:before, &:after {
                        opacity: 1;
                    }
                }
            }
        }
    }

    .loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        svg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }
}
</style>