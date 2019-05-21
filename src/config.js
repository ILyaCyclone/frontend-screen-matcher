const resolutions = {
    "xs": {
        infix: "xs",
        description : "mobile 1 column",
        width: 575,
        diffCluster: { left: 0, top: 69, right: 574, bottom: 468 }
    },
    "sm": {
        infix: "sm",
        description: "mobile 2 column",
        width: 576,
        diffCluster: { left: 0, top: 69, right: 671, bottom: 468 }
    },
    "md": {
        infix: "md",
        description: "tablet 3 column",
        width: 768,
        diffCluster: { left: 0, top: 156, right: 769, bottom: 705 }
    },
    "lg": {
        infix: "lg",
        description: "desktop 4 column",
        width: 992,
        diffCluster: { left: 0, top: 156, right: 993, bottom: 705 }
    },
    "xl": {
        infix: "xl",
        description: "large desktop 4 column",
        width: 1200,
        diffCluster: { left: 0, top: 156, right: 1201, bottom: 705 }
    }
};

const addresses = {
    "hp": {
        description : "home page",
        address: "https://rut-miit.ru",
        bounds: {
            "xs": { left: 0, top: 69, right: 574, bottom: 468 },
            "sm": { left: 0, top: 69, right: 671, bottom: 468 },
            "md": { left: 0, top: 156, right: 769, bottom: 705 },
            "lg": { left: 0, top: 156, right: 993, bottom: 705 },
            "xl": { left: 0, top: 156, right: 1201, bottom: 705 },
        }
    },
    "news": {
        description : "news page",
        address: "https://rut-miit.ru/page/1311"
    },
    "plan": {
        description : "plan page",
        address: "http://deasigndemo.com/rtu/applicants_index.html?year=2010&city=1&level=5&training=20773"
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
