const resolutions = {
    "xs": {
        infix: "xs",
        description : "mobile 1 column",
        width: 575
    },
    "sm": {
        infix: "sm",
        description: "mobile 2 column",
        width: 576
    },
    "md": {
        infix: "md",
        description: "tablet 3 column",
        width: 768
    },
    "lg": {
        infix: "lg",
        description: "desktop 4 column",
        width: 992
    },
    "xl": {
        infix: "xl",
        description: "large desktop 4 column",
        width: 1200
    }
};

const addresses = {
    "hp": {
        description : "home page",
        address: "https://rut-miit.ru"
    },
    "news": {
        description : "news page",
        address: "https://rut-miit.ru/page/1311"
    }
};

const directories = {
    "test": {
        description : "directory for test screenshots",
        path: '.\\screenshots\\test'
    },
    "golden": {
        description : "directory for golden screenshots",
        path: '.\\screenshots\\golden'
    },
    "result": {
        description : "directory for result pictures",
        path: '.\\screenshots\\results'
    }
};

module.exports.resolutions = resolutions;
module.exports.addresses = addresses;
module.exports.directories  = directories ;
