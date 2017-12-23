new Promise((resolve, reject) => {
    VK.init({
        apiId: 6308299
    })
    VK.Auth.login(data => {
        if (data.session) {
            resolve();
        } else {
            reject(new Error('Не удалось авторизоваться'));
        }
    }, 2 | 4);
}).then(() => {
    return new Promise((resolve, reject) => {
        VK.api('friends.get', { fields: 'photo_50', v: '5.69', count: 15 }, data => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.response);
            }
        })
    })
}).then(friends => {
    let allFriendsList = {};
    let selectedFriendsList = {};
    const listOfSelected = document.querySelector('.container-drop');
    const listOfAll = document.querySelector('.friends__container');
    const saveBtn = document.querySelector('.save-btn');
    const searchFull = document.querySelector('.search-full');
    const serachSelected = document.querySelector('.search-list');

    if (localStorage.allFriends) {
        let allFriends = JSON.parse(localStorage.allFriends),
            selectedFriends = JSON.parse(localStorage.selectedFriends);

        for(let key in allFriends) {
            allFriendsList[key] = allFriends[key];
        }
        for (let key in selectedFriends) {
            selectedFriendsList[key] = selectedFriends[key];
        }
        renderTemp(allFriendsList, listOfAll);
        renderTemp(selectedFriends, listOfSelected, 'friend__add_rotate');
    } else {
        for (let key in friends) {
            allFriendsList[key] = friends[key];
        }
        selectedFriendsList = {
            items: []
        };
        renderTemp(allFriendsList, listOfAll);
    }
    function renderTemp (listItems, container, className) {
        className = className || '';
        const template = `
            {{#each items}}
            <div class="friend" data-id="{{id}}">
                <img class="friend__photo" src="{{photo_50}}" alt="Фото">
                <div class="friend__name">{{first_name}} {{last_name}}</div>
                <div class="friend__add ${className}"></div>
            </div>
            {{/each}}`;
        const render = Handlebars.compile(template);
        const html = render(listItems);

        container.innerHTML = html;
    }
    // start save friends)
    function saveLists(e) {
        e.preventDefault();
        // if (!listOfSelected.children.length) {
        //     alert('Choose your friends');

        //     return;        
        // };

        localStorage.allFriends = JSON.stringify(allFriendsList);
        localStorage.selectedFriends = JSON.stringify(selectedFriendsList);

        alert('Friends were saved!');
    }

    saveBtn.addEventListener('click', saveLists);
    // end save
    // start filtr
    function isMatching (full, chunk) {
        return full.toLowerCase().includes(chunk.toLowerCase());
    }
    function keyUpSelected (e) {
        let tempObj = {
            items: []
        };

        selectedFriendsList.items.forEach((item, i) => {
            if (isMatching(`${item.first_name} ${item.last_name}`, e.target.value)) {
                tempObj.items.push(item);
            } else if (!e.target.value) {
                tempObj.items.push(item);
            }
            renderTemp(tempObj, listOfSelected, 'friend__add_rotate');
        })
    }
    function keyUpAll (e) {
        let tempObj = {
            items: []
        };

        allFriendsList.items.forEach((item, i) => {
            if (isMatching(`${item.first_name} ${item.last_name}`, e.target.value)) {
                tempObj.items.push(item);
            } else if (!e.target.value) {
                tempObj.items.push(item);
            }
            renderTemp(tempObj, listOfAll);
        })
    }
    searchFull.addEventListener('keyup', keyUpAll);
    serachSelected.addEventListener('keyup', keyUpSelected);
    // end filtr
    // start Drag & Drop
    let dragObj = {};

    document.querySelector('.main').onmousedown = function (e) {
        // исключаем клик по правой клавише
        if (e.which != 1) return
        // отменяем действие по умолчанию, чтобы не выделяло текст
        e.preventDefault();

        let elem = e.target.closest('.friend');

        if (!elem) return;

        dragObj.elem = elem;

        dragObj.downX = e.pageX;
        dragObj.downY = e.pageY;
    }

    document.onmousemove = function (e) {
        if (!dragObj.elem) return

        if (!dragObj.avatar) {
            let moveX = e.pageX - dragObj.downX,
                moveY = e.pageY - dragObj.downY;

            if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) return;

            dragObj.avatar = createAvatar(e);
            if (!dragObj.avatar) {
                dragObj = {};

                return;
            }
            let coords = getCoords(dragObj.avatar);

            dragObj.shiftX = dragObj.downX - coords.left;
            dragObj.shiftY = dragObj.downY - coords.top;

            startDrag(e);
        }
        dragObj.avatar.style.left = e.pageX - dragObj.shiftX + 'px';
        dragObj.avatar.style.top = e.pageY - dragObj.shiftY + 'px';

        return false;
    }

    document.onmouseup = function (e) {
        // обработать перенос, если он идет
        if (dragObj.avatar) {
            finishDrag(e);
        }

        // очистим "состояние переноса" dragObj
        dragObj = {};
    }

    function createAvatar() {
        // запомнить старые свойства
        var avatar = dragObj.elem;
        var old = {
            parent: avatar.parentNode,
            nextSibling: avatar.nextSibling,
            position: avatar.position || '',
            left: avatar.left || '',
            top: avatar.top || '',
            zIndex: avatar.zIndex || ''
        };

        // отмена переноса
        avatar.rollback = function () {
            old.parent.insertBefore(avatar, old.nextSibling);
            avatar.style.position = old.position;
            avatar.style.left = old.left;
            avatar.style.top = old.top;
            avatar.style.zIndex = old.zIndex
        };

        return avatar;
    }

    function getCoords(elem) {
        var box = elem.getBoundingClientRect();

        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };

    }

    function startDrag() {
        var avatar = dragObj.avatar;

        document.querySelector('.popup-bg').appendChild(avatar);
        avatar.style.zIndex = 9999;
        avatar.style.position = 'absolute';
    }

    function finishDrag(e) {
        var dropElem = findDroppable(e);

        if (!dropElem || dropElem === dragObj.elem.parentNode) {
            dragObj.avatar.rollback();
        } else {
            dropingElem(dropElem);
        }
    }
    // обновление списков
    function selectedUpd (elem) {
        allFriendsList.items.forEach((item, i) => {
            if (+elem.dataset.id === item.id) {
                selectedFriendsList.items.push(item);
                allFriendsList.items.splice(i, 1);
            } 
        })
    }
    function allUpd (elem) {
        selectedFriendsList.items.forEach((item, i) => {
            if (+elem.dataset.id === item.id) {
                allFriendsList.items.push(item);
                selectedFriendsList.items.splice(i, 1);
            }
        })
    }
    // размещение элемента
    function dropingElem(elem) {
        elem.appendChild(dragObj.elem);
        dragObj.elem.style.position = 'relative';
        dragObj.elem.style.left = 0;
        dragObj.elem.style.top = 0;
        if (elem.classList.contains('container-drop')) {
            dragObj.elem.querySelector('.friend__add')
                .classList.add('friend__add_rotate');
            selectedUpd(dragObj.elem);
        } else {
            dragObj.elem.querySelector('.friend__add')
                .classList.remove('friend__add_rotate');
            allUpd(dragObj.elem);
            // --> вставить удаление из выбранных и добавление в общий
        }
    }
    // определения дроп контейнера
    function findDroppable(event) {
        // спрячем переносимый элемент
        dragObj.avatar.hidden = true;

        // получить самый вложенный элемент под курсором мыши
        var elem = document.elementFromPoint(event.clientX, event.clientY);

        // показать переносимый элемент обратно
        dragObj.avatar.hidden = false;

        if (elem == null) {
            return null;
        }

        return elem.closest('.container-drop') || elem.closest('.friends__container');
    }

    // end D&D
    // add friend by click

    function clickHandler(e) {
        if (!e.target.classList.contains('friend__add')) return;
        let elem = e.target.parentNode,
            listOfSelected = document.querySelector('.container-drop'),
            listOfAll = document.querySelector('.friends__container');

        if (elem.parentNode === listOfAll) {
            listOfAll.removeChild(elem);
            listOfSelected.appendChild(elem);
            e.target.classList.add('friend__add_rotate');
            selectedUpd(elem);
        } else {
            listOfSelected.removeChild(elem);
            listOfAll.appendChild(elem);
            e.target.classList.remove('friend__add_rotate');
            allUpd(elem);
        }
    }

    document.querySelector('.popup').addEventListener('click', clickHandler);

}).catch((e) => {
    console.error(e.message);
})