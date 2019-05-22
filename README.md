# frontend-screen-matcher

Приложение предназначено для создания скриншотов и проведения тестов по их сравнению.
Для начала работы с приложением, необходимо его установить. Установка:
1. Уставноить Node js;
2. Скачать папку с проектом из данного гит-репозитория;
3. Провести все необходимые предварительные настройки в /src/config.js.

В файле /src/config.js настраиваются такие параметры, как:
1. Набор разрешений экрана;
2. Набор web-адресов;
3. Набор директорий для сохранения скриншотов (по умолчанию папка screenshots создастся внутри проекта).

Приложение имеет две команды: [screenshot](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#screenshot) и [test](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#test).

## screenshot
Для запуска команды screenshot необходимо из папки проекта в командной строке прописать:

    npm start screenshot

Команда screenshot имеет четыре входных атрибута: разрешение страницы ([size](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#size)), адрес web-страницы ([url](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#url)), директорию ([dir](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#dir)), в которую сохраняются файлы и имя файла ([fn](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#fn)), который будет сохранен. Если параметр не указан, то делается скриншот по каждому из значений, указанных в config.js. Для задания нескольких значений в один атрибут необходимо перечислить их через запятую без пробелов.

**Перед началом задания входных атрибутов необходимо прописать "--".**

Также данную команду можно запускать короче: sc или s.

### size

Атрибут size принимает на вход размер ширины страницы в пикселях для будущего скриншота. На вход может быть принято числовое значение или алиас, который указан в /config.js. Например:

    npm start sc -- --size md,960
    
Если не указать атрибут size, то будут сделаны скриншоты по всем разрешениям, указанным в /config.js.

### url

Атрибут url принимает на вход web-адрес страницы для которой будет сделан скриншот. Также есть возможность указания алиасов из /config.js. Например:

    npm start sc -- --url http://miit.ru,news
    
Если не указать атрибут url, то будут сделаны скриншоты по всем адресам, указанным в /config.js.
    
### dir

Атрибут dir принимает на вход алиас директории, записанной в /config.js. В эту директорию будут сохранены сделанные скриншоты. Например:

    npm start sc -- --dir golden
    
### fn

Атрибут fn принимает на вход имя файла, под которым будет сохранен скриншот страницы, адрес которой не прописан в congif.js. То есть, если в списке аргументов --url будет прописан неизвестный адрес (неизвестный - отсутствует в config.js), то на каждый такой url должен быть прописан --fn для сохранения его на диск. Например:

    npm start sc -- --url news,http://miit.ru --fn oldPage

Еще примеры:

Создание скриншотов на всех web-адресах, но только в заданных разрешениях:

    npm start sc -- --size md,960

Создание скриншота с заданной шириной на заданных web-страницах в golden директории:

    npm start sc -- --size 960 --url http://miit.ru,news --dir golden --fn oldPage


## test
Команда test имеет два входных параметра: разрешение страницы ([size](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#size)) и адрес web-страницы ([имя файла](https://github.com/Adusya/frontend-screen-matcher/blob/master/README.md#fn)). Работа с параметрами осуществляется также, как и в команде screenshot. Для запуска теста необходимо создать скриншоты и в golden и в test директориях. 

Примеры:

    npm start test
    
или
    
    npm start t -- --size xl,960 --fn news,oldPage
    
Также данную команду можно запускать короче: t.
    
