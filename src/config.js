const resolutions = {
    // "375-iphone8": {
    //     description: "xs - mobile 1 column",
    //     device: "iPhone 8"
    // },
    "375": {
        description: "xs - mobile 1 column",
        width: 375
    },
    "576": {
        description: "sm - mobile 2 column",
        width: 576
    },
    // "768-iPad": {
    //     description: "md - tablet 3 column",
    //     device: "iPad"
    // },
    "768": {
        description: "md - tablet 3 column",
        width: 768
    },
    "992": {
        description: "lg - desktop 4 column",
        width: 992
    },
    "1240": {
        description: "xl - large desktop 4 column",
        width: 1240
    }
};

const baseUrl =
    "https://rut-miit.ru";
    // "http://10.242.101.40";

    // "http://wl3n1.miit.ru:7003/portal";
    // "http://wl3n2.miit.ru:7003/portal";

const addresses = {
    "main": {
        description: "home page",
        address: baseUrl
        , ignores: [
            { type: "css", selector: ".main-slider-v2", description: "slide may change during screenshot making" },
            // {type: "css", selector: ".article-list__preview-wrap", description: "new list"}
            { type: "css", selector: ".article__preview > a", description: "each article card" }
        ]
    },
    "news": {
        address: baseUrl + "/news"
        , waits: [{ type: "css", selector: ".article-list .article__preview" }]
        , ignores: [
            // {type: "css", selector: "#articles", description: "new list"}
            { type: "css", selector: ".article__preview > a", description: "each article card" }
        ]
    },
    "admissions": {
        address: baseUrl + "/admissions"
        , ignores: [{ type: "css", selector: "#yandex-map" }]
        , waits: [{ type: "css", selector: ".na-science-container .na-science" }]
    },
    "admissions-degrees": {
        address: baseUrl + "/admissions/degrees"
        , waits: [{ type: "css", selector: ".applicants_specialization .applicants__places" }]
        , ignores: [
            { type: "css", selector: ".applicants_specialization" }
        ]
    },
    "admissions-degrees-rating": {
        address: baseUrl + "/admissions/degrees/51259"
        , waits: [{ type: "css", selector: ".applicants__list-table-wrap.applicants__list-table-wrap--bottom" }]
        , ignores: [
            { type: "css", selector: ".applicants__places-xs", description: "number of admissions mobile" },
            { type: "css", selector: ".applicants__places tbody", description: "number of admissions desktop" },
            { type: "css", selector: ".js-applicants.glasspane__wrapper" }
        ]
    },

    "timetable-catalog": { address: baseUrl + "/timetable" },
    "timetable-group": { address: baseUrl + "/timetable/140048" },
    "timetable-profile": { address: baseUrl + "/people/709306/timetable" },
    "timetable-group-exams": { address: baseUrl + "/timetable/140048?start=2020-01-01", description: "exams" },

    "news-item_with-wide-image": { address: baseUrl + "/news/159935" },
    "news-item_with-small-image": { address: baseUrl + "/news/162380" },
    "news-item_without-image": { address: baseUrl + "/news/159825" },

    "article_with-side-menu": { address: baseUrl + "/sveden/education" },
    "article_without-side-menu": { address: baseUrl + "/sveden" },
    "article_with-list": { address: baseUrl + "/org/projects/lectures" },

    "depts": { address: baseUrl + "/depts" },
    "dept": { address: baseUrl + "/depts/294" },

    "people": {
        address: baseUrl + "/people"
        , ignores: [{ type: "css", selector: ".people .info-block__header-text .text-secondary", description: "number of people" }]
    },
    "profile": { address: baseUrl + "/people/17" },

    "edu-programs": { address: baseUrl + "/edu/programs" },
    "speciality": {
        address: baseUrl + "/edu/programs/1013100"
        , ignores: [
            { type: "css", selector: ".applicants__props-wrap_md-place", description: "number of admissions mobile" },
            { type: "css", selector: ".applicants__places table table", description: "number of admissions desktop" }
        ]
    },
    "speciality-implementation": {
        address: baseUrl + "/edu/programs/1013100/4267916"
        , ignores: [
            { type: "css", selector: ".applicants__props-wrap_md-place", description: "number of admissions mobile" },
            { type: "css", selector: ".applicants__places table table", description: "number of admissions desktop" }
        ]
    },

    "feedback": { address: baseUrl + "/feedback" },
};

const directories = {
    "test": {
        description: "directory for test screenshots",
        path: '.\\screenshots\\test'
    },
    "golden": {
        description: "directory for golden screenshots",
        path: '.\\screenshots\\golden'
    },
    "result": {
        description: "directory for result pictures",
        path: '.\\screenshots\\results'
    }
};

module.exports.resolutions = resolutions;
module.exports.addresses = addresses;
module.exports.directories = directories;
