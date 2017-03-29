$(function () {
	window.cg = $('.content').contractGenerator({
		// 插件初始化完成
		onInitComplete: function () { console.log('is Done...') },
		// 通知导入 JSON 数据
		onImport: function () {
			console.log('import');
			$.get('data.json', function (importData) {
				// 加载 JSON 数据
				window.cg.contractGenerator('load', importData);
			},'json');
		},
		// 导出 JSON 数据
		onExport: function (contractStr) {
			console.log('export');
			console.log(contractStr);
		},
		// 保存时通知
		onSave: function (contractStr) {
			console.log('onSave');
		}
	});
});
// test code...