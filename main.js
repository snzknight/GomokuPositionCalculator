// ==UserScript==
// @name         GomokuPositionCalculator
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  使用快捷键Ctrl+H输入坐标、方向、步数后计算输出棋子坐标并复制到剪贴板，支持拖动弹窗位置，运算后保留弹窗，Ctrl+B关闭弹窗
// @author       snzknight
// @match        https://zhipu-ai.feishu.cn/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    let modal = null;

    // 键盘监听事件
    window.addEventListener('keydown', function(event) {
        // 激活窗口 Ctrl+H
        if (event.ctrlKey && event.key === 'h') {
            if (!modal) {
                showInputModal(); // 显示弹窗
            }
        }

        // 关闭窗口 Ctrl+B
        if (event.ctrlKey && event.key === 'b') {
            if (modal) {
                closeInputModal(); // 关闭弹窗
            }
        }
    });

    // 创建输入框的弹出窗口
    function showInputModal() {
        // 创建弹窗容器
        modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.right = '0';
        modal.style.top = '0';
        modal.style.padding = '20px';
        modal.style.backgroundColor = 'white';
        modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        modal.style.zIndex = 10000;
        modal.style.borderRadius = '8px';
        modal.style.fontFamily = 'Arial, sans-serif';
        modal.style.cursor = 'move'; // 鼠标样式为移动
        modal.style.width = '300px'; // 设置宽度
        modal.style.height = '500px'; // 设置高度（竖屏比例）
        modal.style.overflow = 'auto'; // 内容溢出时可以滚动

        // 设置拖动功能
        let offsetX, offsetY;
        modal.addEventListener('mousedown', function(e) {
            offsetX = e.clientX - modal.getBoundingClientRect().left;
            offsetY = e.clientY - modal.getBoundingClientRect().top;

            // 鼠标移动事件
            function onMouseMove(e) {
                modal.style.left = e.clientX - offsetX + 'px';
                modal.style.top = e.clientY - offsetY + 'px';
            }

            // 鼠标释放事件，取消拖动
            function onMouseUp() {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // 弹窗标题
        let title = document.createElement('h3');
        title.textContent = '输入五子棋参数';
        modal.appendChild(title);

        // 起始坐标输入框
        let startLabel = document.createElement('label');
        startLabel.textContent = '落子坐标 (如 H3):';
        let startInput = document.createElement('input');
        startInput.type = 'text';
        startInput.id = 'startPosition';
        startInput.placeholder = '如 H3';
        modal.appendChild(startLabel);
        modal.appendChild(startInput);

        // 方向输入框
        let directionLabel = document.createElement('label');
        directionLabel.textContent = '方向 (如 U, D, L, R, LU, RU, LD, RD):';
        let directionInput = document.createElement('input');
        directionInput.type = 'text';
        directionInput.id = 'direction';
        directionInput.placeholder = '如 U';
        modal.appendChild(directionLabel);
        modal.appendChild(directionInput);

        // 步数输入框
        let stepsLabel = document.createElement('label');
        stepsLabel.textContent = '步数 (连接棋子的个数):';
        let stepsInput = document.createElement('input');
        stepsInput.type = 'number';
        stepsInput.id = 'steps';
        stepsInput.min = 1;
        modal.appendChild(stepsLabel);
        modal.appendChild(stepsInput);

        // 提交按钮
        let submitButton = document.createElement('button');
        submitButton.textContent = '计算并复制到剪贴板';
        submitButton.style.marginTop = '10px';
        submitButton.onclick = function() {
            let startPosition = document.getElementById('startPosition').value;
            let direction = document.getElementById('direction').value;
            let steps = document.getElementById('steps').value;

            if (!startPosition || !direction || !steps) {
                alert('请填写所有字段');
                return;
            }

            steps = parseInt(steps);

            if (isNaN(steps) || steps <= 0) {
                alert('步数必须是正整数');
                return;
            }

            // 处理计算
            let startColumn = startPosition.charAt(0).toUpperCase();
            let startRow = parseInt(startPosition.slice(1));

            let resultCoordinates = [];

            for (let i = 0; i < steps; i++) {
                let newColumn = startColumn;
                let newRow = startRow;

                switch (direction.toUpperCase()) {
                    case 'U': // 上
                        newRow += i;
                        break;
                    case 'D': // 下
                        newRow -= i;
                        break;
                    case 'L': // 左
                        newColumn = String.fromCharCode(startColumn.charCodeAt(0) - i);
                        break;
                    case 'R': // 右
                        newColumn = String.fromCharCode(startColumn.charCodeAt(0) + i);
                        break;
                    case 'LU': // 左上
                        newColumn = String.fromCharCode(startColumn.charCodeAt(0) - i);
                        newRow += i;
                        break;
                    case 'RU': // 右上
                        newColumn = String.fromCharCode(startColumn.charCodeAt(0) + i);
                        newRow += i;
                        break;
                    case 'LD': // 左下
                        newColumn = String.fromCharCode(startColumn.charCodeAt(0) - i);
                        newRow -= i;
                        break;
                    case 'RD': // 右下
                        newColumn = String.fromCharCode(startColumn.charCodeAt(0) + i);
                        newRow -= i;
                        break;
                    default:
                        alert("方向输入错误！");
                        return;
                }

                // 判断是否越界
                if (newRow < 1 || newRow > 15 || newColumn < 'A' || newColumn > 'O') {
                    alert("越界了，请输入正确的参数！");
                    return;
                }

                // 添加到结果数组
                resultCoordinates.push(newColumn + newRow);
            }

            // 结果输出到剪贴板
            let resultString = resultCoordinates.join(", ");
            GM_setClipboard(resultString);

            // 清空输入框，为下一次输入准备
            document.getElementById('startPosition').value = '';
            document.getElementById('direction').value = '';
            document.getElementById('steps').value = '';
        };

        modal.appendChild(submitButton);
        document.body.appendChild(modal);
    }

    // 关闭输入框的弹出窗口
    function closeInputModal() {
        if (modal) {
            modal.remove(); // 移除弹窗
            modal = null;   // 重置 modal 以便下一次可以重新创建
        }
    }
})();
