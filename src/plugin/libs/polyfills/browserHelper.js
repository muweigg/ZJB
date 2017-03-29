import _, { isNull } from 'lodash';

class BrowserHelper {
    
    constructor () {
        this.ieVer = this.getIEVersion();
        this.isEdgeVer = this.getEdgeVersion();
        this.isIE = this.ieVer === 0 ? false : true;
        this.isEdge = /Edge/i.test(window.navigator.userAgent);
        this.isChrome = /Chrome/i.test(window.navigator.userAgent);
        this.isFirefox = /Firefox/i.test(window.navigator.userAgent);
    }

    getIEVersion () {
        if (window.navigator.appName === 'Microsoft Internet Explorer')
            return parseFloat(/MSIE\s(\d+)/ig.exec(window.navigator.userAgent)[1]);
        if (window.navigator.appName === 'Netscape') {
            let ie11 = /Trident\/7.+rv:(\d+)/ig.exec(window.navigator.userAgent);
            if (_.isNull(ie11)) return 0;
            return parseFloat(ie11[1]);
        }
        return 0;
    }

    getEdgeVersion () {
        if (window.navigator.appName === 'Netscape') {
            let edge = /Edge\/(\d+)/ig.exec(window.navigator.userAgent);
            if (_.isNull(edge)) return 0;
            return parseFloat(edge[1]);
        }
        return 0;
    }

}

export default new BrowserHelper();