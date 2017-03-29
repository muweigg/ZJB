// 插件默认配置
export default {

    // 插件版本号
    version: '0.0.1',

    // 单例模式(预备)
    singletonPattern: true,

    // 款符号配置
    symbol: ['.'],

    // 项符号配置
    paragraphSymbol: [' )'],

    // 子项符号配置(暂不适用置空)
    subParagraphSymbol: [''],

    // 导入 JSON 数据
    onImport: null,

    // 导出 JSON 数据
    onExport: null,

    // 保存
    onSave: null,

    // 保存为 Word
    // onSaveAsWord: null,

    // 初始化完成后的回调
    onInitComplete: null
}
