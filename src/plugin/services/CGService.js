// test data....
// import contractData from '../virtualData/ContractData.json';
// import recommendData from '../virtualData/RecommendData.json';
// import fieldData from '../virtualData/FieldData.json';
// import categoryData from '../virtualData/CategoryData.json';
// import outlineData from '../virtualData/OutlineData.json';

import _, { isArray } from 'lodash';

export default new class CGService {

    constructor () {}

    // 获取合同领域，类型数据
    getFieldData () {
        // let url = 'http://54.223.181.214:8888/index/Test/index.html';
        let url = `http://54.223.181.214:8888/index/Preferc/index.html`;

        return new Promise((resolve, reject) => {
            $.get(
                url,
                repData => resolve(repData),
                'json'
            ).fail(repData => reject(repData));

            /*setTimeout(() => {
                resolve(fieldData);
            }, 1000);*/
        });
    }

    // 获取类别数据
    getCategoryData (id) {
        let url = `http://54.223.181.214:8888/index/Preferc/index.html?pid=${id}`;

        return new Promise((resolve, reject) => {
            $.get(
                url,
                repData => resolve(repData),
                'json'
            ).fail(repData => reject(repData));

            /*setTimeout(() => {
                resolve(categoryData);
            }, 0);*/
        });
    }

    // 获取引言及大纲数据
    getOutlineData (id) {
        let url = `http://54.223.181.214:8888/index/Preferc/getDeco.html?typeid=${id}`;

        return new Promise((resolve, reject) => {
            $.get(
                url,
                repData => resolve(repData),
                'json'
            ).fail(repData => reject(repData));

            /*setTimeout(() => {
                resolve(outlineData);
            }, 0);*/
        });
    }

    // 获取推荐数据
    getRecommendData (params = {
        text: '',
        cateid: '',
        typeid: '',
        parentid: '',
        contentid: '',
        subsidiary: '',
        nexttext: '',
        otherlist: '',
        nextidlist: []
    }) {
        let url = 'http://www.idophin.com/xunsearch.php';
        return new Promise((resolve, reject) => {
            $.post(
                url,
                params, 
                repData => {
                    if (_.isArray(repData) && repData.length === 0
                            || !_.isArray(repData) && repData == '') {
                        this.recommendData = [];
                        resolve([]);
                    } else {
                        resolve(repData.Data);
                    }
                },
                'json'
            ).fail(repData => reject(repData));

            /*setTimeout(() => {
                resolve(recommendData);
            }, 1000);*/
        });
    }

    getEmptyContract () {
        return {
            type: 0,
            // 名称
            name: '',
            // 领域
            field: {
                id: 0,
                pid: 0,
                name: ''
            },
            // 类别
            category: {
                id: 0,
                pid: 0,
                name: ''
            },
            // 是否空合同
            isEmpty: false,
            // 甲方
            partyA: {
                name: '',
                // 委托处理人/代理人
                client: '',
                // 委托处理人/代理人 电话
                clientPhone: '',
                // 法定代表人
                legalPerson: '',
                // 法定代表人 电话
                legalPersonPhone: '',
                // 家庭地址
                homeAddress: '',
                // 公司名称
                companyName: '',
                // 公司地址
                companyAddress: '',
                // 营业执照号
                licenseNo: ''
            },
            // 乙方
            partyB: {
                name: '',
                // 委托处理人/代理人
                client: '',
                // 委托处理人/代理人 电话
                clientPhone: '',
                // 法定代表人
                legalPerson: '',
                // 法定代表人 电话
                legalPersonPhone: '',
                // 家庭地址
                homeAddress: '',
                // 公司名称
                companyName: '',
                // 公司地址
                companyAddress: '',
                // 营业执照号
                licenseNo: ''
            },
            // 引言
            duction: {},
            // 大纲
            outline: []
        }
    }

    save (data) {
        let url ='wordexport.php';

        return new Promise((resolve, reject) => {
            let form = document.querySelector('#saveForm'),
                hidden = document.createElement('input');
            if (form) form.parentNode.removeChild(form);
            hidden.name = 'wordjson';
            hidden.value = JSON.stringify(data);
            form = document.createElement('form');
            form.id = 'saveForm';
            form.target = '_blank';
            form.method = 'post';
            form.action = url;
            form.appendChild(hidden);
            document.body.appendChild(form);
            form.submit();
            resolve();
        });
    }

    delRecommend (recommend) {
        let url = `http://54.223.181.214:8888/index/Preferc/updateDecotion.html?id=${recommend.id}`;

        return new Promise((resolve, reject) => {
            $.get(
                url,
                repData => {
                    if (repData.status === 1) resolve(repData)
                    else reject(repData)
                },
                'json'
            ).fail(
                repData => reject(repData)
            );
        });
    }
};
