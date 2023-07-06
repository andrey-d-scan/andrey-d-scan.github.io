const hamburger = document.querySelector('.hamburger'),
    closeElem = document.querySelector('.menu__close'),    
    closeItem = document.querySelectorAll('.menu__item'),
    menu = document.querySelector('.menu__wrapper');

hamburger.addEventListener('click', () => {
    menu.classList.add('menu__wrapper-active');
});

closeElem.addEventListener('click', () => {
    menu.classList.remove('menu__wrapper-active');
});

closeItem.forEach(item => {
    item.addEventListener('click', () => {
        menu.classList.remove('menu__wrapper-active');
    })
});