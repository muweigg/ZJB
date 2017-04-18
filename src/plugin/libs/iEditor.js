import settings from "../config/defaultConfig";
import browserHelper from '../libs/polyfills/browserHelper';
import _, { camelCase, isFunction, debounce, defer } from 'lodash';

class iEditor {

    settings = settings;

    focusNode = null;

    focusNodePrev = null;

    focusNodes = [];

    isFirstNode = false;

    isLastNode = false;

    nodeText = { left: '', right: '', content: '' };

    syncSymbol = false;

    isHoldBackspace = false;
    isHoldDelete = false;

    upgradeEls = [];
    
    downgradeEls = [];

    undoRecords = [];

    redoRecords = [];

    constructor (editor) {

        this.s = this.initListSymbol(this.settings.symbol);
        this.ps = this.initListSymbol(this.settings.paragraphSymbol);
        this.sps = this.initListSymbol(this.settings.subParagraphSymbol);

        if (editor instanceof Node) {
            this.editor = editor;
            this.checkFormatSymbol();
            if (this.editor.getAttribute('contenteditable')) {
                this.characterDataModified = _.debounce(this.pushUndo, 500, { 'leading': true, 'trailing': false });
                this.initEditor();
                this.isEmpty();
            }
        }
    }

    initListSymbol = (symbol) => {
        if (symbol.length >= 2) {
            return [symbol[0], symbol[1]];
        } else {
            return ['', symbol[0]];
        }
    }

    initEditor = () => {
        this.editor.addEventListener('keydown', this.formatProcess, false);
        this.editor.addEventListener('keypress', this.formatProcess, false);
        this.editor.addEventListener('keyup', this.formatProcess, false);
        this.editor.addEventListener('mousedown', this.formatProcess, false);
        this.editor.addEventListener('mousemove', this.formatProcess, false);
        this.editor.addEventListener('mouseup', this.formatProcess, false);
        this.editor.addEventListener('paste', this.pasteFormatFilter, false);
        // this.editor.addEventListener('DOMCharacterDataModified', this.characterDataModified, false);
        // this.editor.addEventListener('DOMNodeInserted', this.nodeInserted, false);
        
    }

    destroyEditor = () => {
        this.editor.removeEventListener('keydown', this.formatProcess, false);
        this.editor.removeEventListener('keypress', this.formatProcess, false);
        this.editor.removeEventListener('keyup', this.formatProcess, false);
        this.editor.removeEventListener('mousedown', this.formatProcess, false);
        this.editor.removeEventListener('mousemove', this.formatProcess, false);
        this.editor.removeEventListener('mouseup', this.formatProcess, false);
        this.editor.removeEventListener('paste', this.pasteFormatFilter, false);
        // this.editor.removeEventListener('DOMCharacterDataModified', this.characterDataModified, false);
        // this.editor.removeEventListener('DOMNodeInserted', this.nodeInserted, false);
    }

    /*characterDataModified = e => {
        console.log('DOMCharacterDataModified: ', e);
    }*/

    /*nodeInserted = e => {
        console.log('DOMNodeInserted: ', e);
    }*/

    removeBR = (node) => {
        if (node && node.lastChild && node.lastChild.nodeName === 'BR') {
            node.removeChild(node.lastChild);
        }
    }

    /**
     * 合并并且删除节点
     * 
     * 
     * @memberOf iEditor
     */
    mergeAndDeleteNode = (margeNode, delNode) => {
        if (delNode) {
            let childNodes = [...delNode.childNodes].reverse(),
                isEmptyNode = delNode.textContent.length === 0,
                toStart = margeNode.textContent.length === 0;

            let range = this.setCaret(margeNode, toStart).cloneRange();

            if (!isEmptyNode) {
                for (let n of childNodes) {
                    range.insertNode(n);
                }
            }

            delNode.parentNode.removeChild(delNode);
        }
    }

    /**
     * 更新 Pid
     * 
     * 
     * @memberOf iEditor
     */
    updatePid = (node) => {
        if (!node) node = this.focusNodePrev;
        let next = node.nextSibling, id = this.editor.id;
        if (node.id) id = node.id;
        if (next && next.nodeName === 'OL') {
            let lis = this.getSubNodes(next, 'li');
            for (let li of lis) {
                li.set('pid', id);
            }
        }
    }

    /**
     * 克隆元素
     * 
     * 
     * @memberOf iEditor
     */
    cloneNode = () => {
        let node = this.focusNodePrev, clone = node.cloneNode(true),
            next = node.nextSibling;
        clone.id = '';
        clone.innerHTML = '';
        if (!(browserHelper.isIE && browserHelper.ieVer < 11)) {
            clone.appendChild(document.createTextNode(''));
            clone.appendChild(document.createElement('br'));
        }
        if (next) this.focusNodePrev.parentNode.insertBefore(clone, next);
        else this.focusNodePrev.parentNode.appendChild(clone);
        
        this.setCaret(clone);
    }

    getLastChild = node => {
        if (node.lastChild)
            node = this.getLastChild(node.lastChild);
        return node;
    }

    /**
     * 无内容的情况下清除 ID
     * 
     * 
     * @memberOf iEditor
     */
    clearNodeId = node => {
        if (node && node.nodeName !== 'DIV' && node.textContent.length === 0)
            node.id = '';
    }

    /**
     * 当前列表元素中光标前后无内容并且属于最后一个子节点
     * 
     * 1、 12              1、12
     *     1. 34     =>       1. 34
     *     2. |            2、|
     * 
     * @memberOf iEditor
     */
    enterUpgrade = () => {
        let node = this.focusNodePrev,
            parentList = this.getParentList(node),
            li = this.getLi(parentList.length - 1),
            list = node.parentNode, parent = list.parentNode,
            next = list.nextSibling,
            pid = '';

        list.removeChild(node);

        let lis = this.getSubNodes(list, 'li');
        if (lis.length === 0)
            list.parentNode.removeChild(list);

        if (next) parent.insertBefore(li, next);
        else parent.appendChild(li);

        let prev = li.previousSibling;
        while (prev && prev.nodeName != 'LI') {
            prev = prev.previousSibling;
        }

        pid = prev.get('pid');
        li.set('pid', pid);

        this.setCaret(li);
    }

    /**
     * Enter 回车处理
     * 
     * 
     * @memberOf iEditor
     */
    enterProcess = e => {
        let node = this.focusNodePrev,
            parentList = this.getParentList(node);
        
        if (e.type === 'keydown') {

            this.clearNodeId(node);

            // 插入列表
            if (e.ctrlKey) {
                this.insertList();
                return;
            }

            // 只有一级列表，并且当前操作列表元素内容为空时
            // 克隆当前元素属性列表 ID 除外，并追加到列表中
            if (parentList.length === 1 && node.textContent.length === 0 && !e.shiftKey) {
                e.preventDefault();
                this.cloneNode();
            }

            if (parentList.length !== 1) {
                if (!this.isLastNode && this.nodeText.content.length === 0) {
                    e.preventDefault();
                    this.cloneNode();
                } else if (this.isLastNode && node.textContent.length === 0) {

                    // 当前列表元素中光标前后无内容并且属于最后一个子节点
                    //
                    // 1、 12              1、12
                    //     1. 34     =>       1. 34
                    //     2. |            2、|
                    //
                    if (browserHelper.isEdge || browserHelper.isIE) {
                        e.preventDefault();
                        this.enterUpgrade();
                    } else if (!e.ctrlKey) {
                        // Firefox & Chrome
                        this.syncSymbol = true;
                    }
                }
            }
        }

        if (e.type === 'keyup') {

            let node = this.focusNode;

            this.clearNodeId(node);

            // 同步符号
            if (this.syncSymbol) {
                let parentList = this.getParentList(node),
                    prev = node.previousSibling,
                    pid = '';

                while (prev && prev.nodeName != 'LI') {
                    prev = prev.previousSibling;
                }

                pid = prev ? prev.get('pid') : this.editor.id;

                switch (parentList.length) {
                    case 1:
                        node.set('pid', pid)
                            .set('subsidiary', 2)
                            .set('symbol-before', this.s[0])
                            .set('symbol-after', this.s[1]);
                        break;
                    case 2:
                        node.set('pid', pid)
                            .set('subsidiary', 3)
                            .set('symbol-before', this.ps[0])
                            .set('symbol-after', this.ps[1]);
                        break;
                }

                node.innerHTML = '';
                node.appendChild(document.createTextNode(''));
                node.appendChild(document.createElement('br'));

                this.syncSymbol = false;
            }
        }
    }

    /**
     * Backspace 退格键处理
     * 
     * 
     * @memberOf iEditor
     */
    backspaceProcess = e => {
        let listNode = this.getParentList(),
            isCollapsed = this.getSelection().isCollapsed;

        if (e.type === 'keydown') {
            this.isHoldBackspace = true;

            let node = this.focusNodePrev;
            
            // 只有一级列表时，并且光标的起始和结束为同一位置
            if (listNode.length === 1 && isCollapsed) {

                if (node.textContent.length === 0) {

                    // 当前列表元素内容为空时阻止默认行为
                    //
                    // 1、12        1、12|
                    // 2、|   =>
                    //
                    e.preventDefault();
                    let prev = node.previousSibling;
                    if (prev) {
                        // this.removeBR(prev);
                        let toStart = prev.textContent.length === 0 ? true : false;
                        this.setCaret(prev, toStart);
                        node.parentNode.removeChild(node);
                        this.updatePid(prev);
                    }
                } else if (this.nodeText.left.length === 0) {

                    // 当前列表元素中光标前面内容为空并且总内容不为空时阻止默认行为
                    //
                    // 1、             1、|1234
                    // 2、|1234   =>
                    //
                    e.preventDefault();
                    let prev = node.previousSibling;
                    if (prev.nodeName != "OL") {
                        this.removeBR(prev);
                        this.mergeAndDeleteNode(prev, node);
                        this.updatePid(prev);
                    } else {
                        let lastChild = this.getLastChild(prev);
                        this.removeBR(lastChild);
                        this.mergeAndDeleteNode(lastChild, node);
                    }
                }

                // 有二/三级列表时，并且光标的起始和结束为同一位置
            } else if ((listNode.length === 2 || listNode.length === 3) && isCollapsed) {

                if (this.nodeText.left.length === 0 && this.isFirstNode) {

                    // 当前列表元素中光标前面内容为空并且属于第一个子节点
                    //
                    // 1、 12            1、12|34
                    //     2、|34   =>
                    //
                    e.preventDefault();
                    let list = node.parentNode,
                        prev = node.parentNode.previousSibling;

                    this.removeBR(prev);
                    this.mergeAndDeleteNode(prev, node);

                    let lis = this.getSubNodes(list, 'li');
                    if (lis.length === 0)
                        list.parentNode.removeChild(list);
                } else if (this.nodeText.left.length === 0) {

                    // 当前列表元素中光标前面内容为空并且不属于第一个子节点
                    //
                    // 1、 12              1、12
                    //     1. 34     =>       1. 34|56
                    //     2. |56
                    //
                    e.preventDefault();
                    let prev = node.previousSibling;
                    if (prev.nodeName != "OL") {
                        this.removeBR(prev);
                        this.mergeAndDeleteNode(prev, node);
                        this.updatePid(prev);
                    } else {
                        let lastChild = this.getLastChild(prev);
                        this.removeBR(lastChild);
                        this.mergeAndDeleteNode(lastChild, node);
                    }
                    /*this.removeBR(prev);
                    this.mergeAndDeleteNode(prev, node);
                    this.updatePid(prev);*/
                }

            }

            this.clearNodeId(node);
        }

        if (e.type === 'keyup') {
            this.isHoldBackspace = false;
            this.clearNodeId(this.focusNode);
        }
    }

    /**
     * Del 删除键处理
     * 
     * 
     * @memberOf iEditor
     */
    deleteProcess = e => {
        let node = this.focusNodePrev,
            next = node.nextSibling,
            listNode = this.getParentList(node),
            isCollapsed = this.getSelection().isCollapsed;

        if (e.type === 'keydown') {
            this.isHoldDelete = false;

            this.clearNodeId(node);

            if (browserHelper.isFirefox) {
                let lis = this.getSubNodes(listNode[0], 'li'),
                    isEmpty = this.nodeText.content.length === 0;

                // 当前列表只有一级且元素内容为空时阻止默认行为 (Firefox)
                //
                // 1、|   =>    1、|
                //
                if (listNode.length === 1) {
                    if (lis.length === 1 && isEmpty) {
                        e.preventDefault();
                    } else if (lis.length !== 1 && isEmpty && this.isFirstNode) {
                        e.preventDefault();
                        let next = this.focusNode.nextSibling;
                        this.mergeAndDeleteNode(this.focusNode, next);
                    }
                }
            }

            // 1、12|     =>    1、12|34
            //    2. 34
            //
            if (this.nodeText.right === '' && next && next.nodeName === 'OL') {
                e.preventDefault();

                let child = next.firstChild;

                if (child.nodeName === 'LI') {
                    this.removeBR(node);
                    this.mergeAndDeleteNode(node, child);
                }

                let lis = this.getSubNodes(next, 'li');

                if (lis.length === 0)
                    next.parentNode.removeChild(next);

            } else if (this.isLastNode && this.nodeText.right === '' && node.previousSibling) {

                // 如果多级列表中元素右边内容为空且是列表最后一个元素，阻止删除
                //
                // 1、12      =>    1、12
                //    2. 34            2. 34
                //    3.|              3.|
                //
                e.preventDefault();
            } 
        }

        if (e.type === 'keyup') {
            this.isHoldDelete = false;
            this.clearNodeId(node);
        }
    }

    /**
     * 键盘事件处理
     * 
     * 
     * @memberOf iEditor
     */
    keyboardEventProcess = e => {
        switch (e.keyCode) {
            case 8:
                this.backspaceProcess(e);
            break;
            case 46:
                this.deleteProcess(e);
            break;
            case 13:
                this.enterProcess(e);
            break;
        }
    }

    /**
     * 格式处理
     * 
     * 
     * @memberOf iEditor
     */
    formatProcess = e => {

        if (e.type === 'keydown' || e.type === 'mousedown') {
            // 历史记录
            if (e.ctrlKey && e.keyCode === 90) {
                e.preventDefault();
                this.undo();
                return;
            }
            // 恢复记录
            /*if (e.ctrlKey && e.keyCode === 89) {
                e.preventDefault();
                this.redo();
                return;
            }*/

            this.boundaryCheck();

            this.focusNodePrev = this.getNode();

            _.defer(() => {
                let focus = this.editor.querySelector('.focus');
                if (focus) focus.classList.remove('focus');
                this.focusNode = this.getNode(true);
                this.focusNode.classList.add('focus');
            });

            // 选中状态下按下方向键重置光标
            let sel = this.getSelection();
            if (this.focusNodes.length > 1) {
                if (sel.rangeCount > 0 && sel.isCollapsed) {
                    if (e.keyCode === 37 && e.keyCode === 38) sel.collapseToStart();
                    if (e.keyCode === 38 && e.keyCode === 40) sel.collapseToEnd();
                }
                this.focusNodePrev = this.focusNodes[this.focusNodes.length - 1];
            }

            if (e.type === 'mousedown' && !sel.isCollapsed) {
                sel.collapseToEnd();
                return;
            }

            if (!e.ctrlKey) this.characterDataModified();

            this.keyboardEventProcess(e);
        }

        if (e.type === 'keypress') {
            if (this.isHoldBackspace && e.keyCode != 8
                || this.isHoldDelete && e.keyCode != 46) {
                e.preventDefault();
                // return;
            }

            if (e.keyCode === 13) {
                if (this.focusNodePrev)
                    this.focusNodePrev.classList.remove('focus');
            }
        }

        if (e.type === 'keyup' || e.type === 'mouseup') {
            this.focusNode = this.getNode(true);

            /*if (browserHelper.isFirefox) {
                this.focusNodePrev = this.editor.querySelector('.focus');
            }
            
            if (this.focusNodePrev)
                this.focusNodePrev.classList.remove('focus');
            this.focusNode.classList.add('focus');*/

            if (e.type === 'mouseup') {
                this.batchUpdate();
                return;
            }

            this.keyboardEventProcess(e);
            this.isEmpty();
            this.batchUpdate();
        }
    }

    /**
     * 边界检查
     * 
     * 
     * @memberOf iEditor
     */
    boundaryCheck = () => {
        _.defer(() => {
            let node = this.getNode();

            try {
                let li = this.editor.querySelector('ol').firstChild;
                if (node.nodeName !== 'OL' && node.nodeName !== 'LI')
                    this.setCaret(li);
            } catch (e) {}
        });
    }

    /**
     * 一批处理
     * 
     * 
     * @memberOf iEditor
     */
    batchUpdate = () => {
        this.nodeText = this.getText();
        // console.log('nodeText: ', JSON.parse(JSON.stringify(this.nodeText)));

        let next = this.focusNode.nextSibling;
        this.isFirstNode = !this.focusNode.previousSibling;
        this.isLastNode = next ? next.nodeName.toLocaleLowerCase() === 'ol' ? true : false : true;
        // console.log('isFirstNode: ', this.isFirstNode, 'isLastNode: ', this.isLastNode);

        this.updateSelectedNodes();
        this.upgradeEls = [];
        this.downgradeEls = [];
        if (this.focusNodes.length !== 0) {
            this.upgradeEls = [...this.focusNodes].filter(el => {
                if (el.get('subsidiary') == 3)
                    return el;
            });
            this.downgradeEls = [...this.focusNodes].filter(el => {
                if (el.get('subsidiary') == 2)
                    return el;
            });
        }
        // console.log('this.upgradeEls: ', this.upgradeEls);
        // console.log('this.downgradeEls: ', this.downgradeEls);
    }

    /**
     * 更新当前选中的元素
     * 
     * 
     * @memberOf iEditor
     */
    updateSelectedNodes = () => {
        let nodes = this.getSelectedElements();
        this.focusNodes = [];
        if (this.focusNodes.length !== nodes.length) {
            this.focusNodes = nodes;
        }
    }

    /**
     * 获取子元素
     * 
     * 
     * @memberOf iEditor
     */
    getSubNodes = (scope, tagName) => {
        let nodes = []
        if (!scope) return [];
        try {
            nodes = [...scope.querySelectorAll(`:scope > ${tagName}`)];
        } catch (e) {
            nodes = [...scope.querySelectorAll(tagName)];
            nodes = nodes.filter(node => {
                if (node.parentNode === scope)
                    return node;
            });
        }
        return nodes;
    }

    /**
     * 获取一个有序列表
     * 
     * 
     * @memberOf iEditor
     */
    getOl = (type = 1) => {
        let ol = document.createElement('ol');
        
        if (type === 1) ol.set('subsidiary', 2);
        else if (type === 2) ol.set('subsidiary', 3);
        else if (type === 3) ol.set('subsidiary', 4);

        return ol;
    }

    /**
     * 获取一个列表项
     * 
     * @param type 2、款 3、项 4、子项
     * 
     * @memberOf iEditor
     */
    getLi = (type = 1) => {
        let id = this.editor.id,
            li = document.createElement('li');

        if (type !== 1 && this.focusNodePrev) id = this.focusNodePrev.id;

        if (type === 1) li.set('pid', id).set('subsidiary', 2).set('symbol-before', this.s[0]).set('symbol-after', this.s[1]);
        else if (type === 2) li.set('pid', id).set('subsidiary', 3).set('symbol-before', this.ps[0]).set('symbol-after', this.ps[1]);
        else if (type === 3) li.set('pid', id).set('subsidiary', 4).set('symbol-before', this.sps[0]).set('symbol-after', this.sps[1]);

        if (!(browserHelper.isIE && browserHelper.ieVer < 11)) {
            li.appendChild(document.createTextNode(''));
            li.appendChild(document.createElement('br'));
        }

        return li;
    }

    /**
     * 检查编辑器是否为空
     * 
     * 
     * @memberOf iEditor
     */
    isEmpty = e => {
        let content = this.editor.textContent,
            nodes = this.editor.querySelectorAll('ol'),
            ol = this.getOl(),
            li = this.getLi();

        ol.appendChild(li);

        if (content.length === 0 && (nodes.length === 0 || nodes[0].childNodes.length === 0)) {
            this.editor.innerHTML = '';
            this.editor.appendChild(ol);
            this.setCaret(li);
        }
    }

    /**
     * 撤销
     * 
     * 
     * @memberOf iEditor
     */
    undo = () => {
        let last = this.undoRecords.pop();
        if (last && this.undoRecords.length !== 0) {
            this.editor.innerHTML = last.html;
            let focus = this.editor.querySelector('.focus');
            this.setCaret(focus, false);
            this.pushRedo(last);
            this.batchUpdate();
        }
    }

    /**
     * 恢复
     * 
     * 
     * @memberOf iEditor
     */
    redo = () => {
        let last = this.redoRecords.pop();
        if (last) {
            this.editor.innerHTML = last.html;
            let focus = this.editor.querySelector('.focus');
            this.setCaret(focus, false);
            this.pushUndo(last);
            this.batchUpdate();
        }
    }

    /**
     * 放入撤销
     * 
     * 
     * @memberOf iEditor
     */
    pushUndo = () => {
        let sel = this.getSelection(),
            anchorOffset = sel.anchorOffset;
        this.undoRecords.push({html: this.editor.innerHTML, offset: anchorOffset});
        this.redoRecords = [];
    }

    /**
     * 放入恢复
     * 
     * 
     * @memberOf iEditor
     */
    pushRedo = (undoRecord) => {
        this.redoRecords.push(undoRecord);
    }

    getSelection = () => {
        // return rangy.getSelection();
        return window.getSelection();
    }

    /**
     * 获取当前光标
     * 
     * 
     * @memberOf iEditor
     */
    getRange = () => {
        let sel = this.getSelection();
        if (sel.type === 'None') return;
        return sel.getRangeAt(0);
    }
    
    /**
     * 获取当前光标所在的元素
     * 
     * 
     * @memberOf iEditor
     */
    getNode = (isEnd = false) => {
        try {
            let range = this.getRange();
            let node = isEnd ? range.endContainer : range.startContainer;
            if (node.nodeType === 3 || node.nodeName === 'BR')
                node = node.parentNode;
            return node;
        } catch (e) {}
    }

    /**
     * 获取光标前的文本
     * 
     * 
     * @memberOf iEditor
     */
    getInputText = () => {
        let range = this.getRange(), inputText = '';
        if (range.collapsed) {
            inputText = range.startContainer.textContent;
        }
        return inputText;
    }

    /**
     * 获取光标之前/之后的文本
     * 
     * 
     * @memberOf iEditor
     */
    getText = () => {

        let range = this.getRange(), node = this.getNode(true),
            content = node.textContent,
            container = range.startContainer,
            offset = range.startOffset,
            left = '', right = '';

        // if (browserHelper.isEdge) {
            if (container.nodeType === 1) {
                container = container.firstChild ? container.firstChild : container;
            }
        // }

        if (range.collapsed) {
            container = container.previousSibling;
            while (container) {
                offset += container.textContent.length;
                container = container.previousSibling;
            }
            left = content.substring(0, offset);
            right = content.substring(offset);
        }

        return {left, right, content};
    }

    /**
     * 获取元素父级列表数组
     * 
     * 
     * @memberOf iEditor
     */
    getParentList = (node, nodes = []) => {
        if (!node) node = this.focusNodePrev;
        if (node && !node.getAttribute('contenteditable')) {
            if (node.nodeName.toLocaleLowerCase() === 'ol') nodes.push(node);
            if (node.parentNode)
                this.getParentList(node.parentNode, nodes);
        }
        return nodes;
    }
    
    /**
     * 设置光标
     * 
     * 
     * @memberOf iEditor
     */
    setCaret = (node, start = true) => {
        let range = document.createRange(),
            sel = this.getSelection();

        node = start ? node.firstChild || node : node.lastChild || node;
        // node = node.nodeName === 'BR' ? node.previousSibling : node;
        range.selectNodeContents(node);
        range.collapse(false);
        if (sel.rangeCount > 0)
            sel.removeAllRanges();
        sel.addRange(range);
        start ? sel.collapseToStart() : sel.collapseToEnd();
        return range;
    }

    /**
     * 插入有序列表
     * 
     * 
     * @memberOf iEditor
     */
    insertList = () => {
        let node = this.focusNodePrev,
            nodes = this.getParentList(node);
        
        if (nodes.length === 3) return;

        let ol = this.getOl(nodes.length + 1), li = this.getLi(nodes.length + 1);

        ol.appendChild(li);
        if (node.nextSibling) {
            node.parentNode.insertBefore(ol, node.nextSibling);
        } else {
            node.parentNode.appendChild(ol);
        }

        this.setCaret(li);
    }

    /**
     * 插入段落（款）
     * 
     * 
     * @memberOf iEditor
     */
    insertParagraph = (node) => {
        if (!node) node = this.getNode();
        let nodes = this.getParentList(node).reverse();

        let li = this.getLi(), len = nodes.length;

        while (node.parentNode !== nodes[0]) {
            node = node.parentNode;
        }

        /*if (len !== 0) {
            node = nodes[0];
        }*/

        if (node.nextSibling) {
            nodes[0].insertBefore(li, node.nextSibling);
        } else {
            nodes[0].appendChild(li);
        }

        this.focusNode.classList.remove('focus');
        li.classList.add('focus');
        this.focusNode = li;

        this.setCaret(li);
    }

    /**
     * 插入项
     * 
     * 
     * @memberOf iEditor
     */
    insertSubParagraph = (node) => {
        if (!node) node = this.getNode();
        let nodes = this.getParentList(node).reverse();

        let ol = this.getOl(2), li = this.getLi(2);
        ol.appendChild(li);

        if (node.id) li.set('pid', node.get('pid'));

        if (node.nextSibling) {
            nodes[0].insertBefore(ol, node.nextSibling);
        } else {
            nodes[0].appendChild(ol);
        }

        this.focusNode.classList.remove('focus');
        li.classList.add('focus');
        this.focusNode = li;

        this.setCaret(li);
    }

    /**
     * 初始化编辑器时检查列表符号，使用自定义符号
     * 
     * 
     * @memberOf iEditor
     */
    checkFormatSymbol = () => {
        let els = this.editor.querySelectorAll('[data-symbol-before], [data-symbol-after]');
        if (els.length !== 0) return;

        let ols = this.editor.querySelectorAll('[contenteditable] > ol, div.article > ol');

        [].forEach.call(ols, ol => {
            let ts = ol.querySelectorAll('ol li[data-subsidiary="2"]');
            let lis = ol.querySelectorAll('ol li[data-subsidiary="3"]');
            let sublis = ol.querySelectorAll('ol li[data-subsidiary="4"]');

            [].forEach.call(ts, li => {
                li.set('symbol-before', this.s[0])
                    .set('symbol-after', this.s[1]);
            });

            [].forEach.call(lis, li => {
                li.set('symbol-before', this.ps[0])
                    .set('symbol-after', this.ps[1]);
            });

            [].forEach.call(sublis, li => {
                li.set('symbol-before', this.sps[0])
                    .set('symbol-after', this.sps[1]);
            });
        });
    }

    /**
     * 粘贴内容过滤
     * 
     * 
     * @memberOf iEditor
     */
    pasteFormatFilter = e => {
        e.preventDefault();
        let text = null;
    
        if(window.clipboardData && clipboardData.setData) {
            text = window.clipboardData.getData('text');
        } else {
            text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('在这里输入粘贴的文本');
        }

        if (text.length > 0) this.pushUndo();

        if (document.body.createTextRange) {

            if (document.selection) {
                textRange = document.selection.createRange();
            } else if (window.getSelection) {
                sel = window.getSelection();
                let range = sel.getRangeAt(0);
                
                let tempEl = document.createElement("span");
                tempEl.innerHTML = "&#FEFF;";
                range.deleteContents();
                range.insertNode(tempEl);
                textRange = document.body.createTextRange();
                textRange.moveToElementText(tempEl);
                tempEl.parentNode.removeChild(tempEl);
            }

            textRange.text = text;
            textRange.collapse(false);
            textRange.select();

        } else {
            document.execCommand("insertText", false, text);
        }
    }

    /**
     * 获取当前编辑器选中的元素
     * 
     * 
     * @memberOf iEditor
     */
    /*getSelectedElements = (isSub = false) => {
        let allSelected = [];
        try {
            let selection = window.getSelection(),
                range = selection.getRangeAt(0),
                allWithinRangeParent = range.commonAncestorContainer.getElementsByTagName("*");

            [].forEach.call(allWithinRangeParent, el => {
                if (selection.containsNode(el, true)) {
                    if (!isSub && el.get('subsidiary') == 2) {
                        allSelected.push(el);
                    } else if (isSub && el.get('subsidiary') == 3) {
                        allSelected.push(el);
                    }
                }
            });

            return allSelected;
        } catch (e) {
            return [];
        }
    }*/

    /**
     * 获取当前编辑器选中的元素
     * 
     * 
     * @memberOf iEditor
     */
    getSelectedElements = (els = [], node, search = {end: false}) => {
        if (!node) node = this.getNode();

        if (node === this.getNode(true)) {
            els.push(node);
            search.end = true;
            return els;
        }

        if (node.nodeType === 1)
            els.push(node);

        if (node.childNodes.length !== 0) {
            this.getSelectedElements(els, node.firstChild, search);
        }

        if (node.nextSibling && !search.end) {
            this.getSelectedElements(els, node.nextSibling, search)
        }

        return els;
    }

    /**
     * 定制升级
     * 
     * 
     * @memberOf iEditor
     */
    upgrade = () => {
        if (this.upgradeEls.length === 0) return;
        let nodeSet = new Set(),
            node = this.upgradeEls[0].parentNode,
            caretEl = null;

        [].forEach.call(this.upgradeEls, el => {
            let li = this.getLi(),
                pNode = el.parentNode;
            nodeSet.add(pNode);
            li.id = el.id;
            li.set('pid', this.editor.id);
            li.innerHTML = el.innerHTML;
            node.parentNode.insertBefore(li, node);
            pNode.removeChild(el);
            caretEl = li;
        });

        nodeSet.forEach((v, k) => {
            let pNode = v.parentNode,
                lis = this.getSubNodes(v, 'li');
            if (lis.length === 0)
                pNode.removeChild(v);
        });

        this.setCaret(caretEl, false);
        this.focusNodePrev = caretEl;
        this.focusNode = caretEl;
        this.focusNode.classList.add('focus');
        this.batchUpdate();
    }

    /**
     * 定制降级
     * 
     * 
     * @memberOf iEditor
     */
    downgrade = () => {
        if (this.downgradeEls.length === 0) return;
        let node = this.downgradeEls[this.downgradeEls.length - 1].nextSibling,
            list = this.editor.querySelector('ol');

        let ol = this.getOl(2), caretEl = null;

        [].forEach.call(this.downgradeEls, el => {
            let li = this.getLi(2);
            li.id = el.id;
            li.set('pid', el.get('pid'));
            li.innerHTML = el.innerHTML;
            ol.appendChild(li);
            el.parentNode.removeChild(el);
            caretEl = li;
        });
        
        if (node) {
            list.insertBefore(ol, node);
        } else {
            list.appendChild(ol);
        }

        this.setCaret(caretEl, false);
        this.focusNodePrev = caretEl;
        this.focusNode = caretEl;
        this.focusNode.classList.add('focus');
        this.batchUpdate();
    }
}

export default iEditor;