; "use strict";

(function ($) {
    $(document).ready(function () {
        var path = getCurrentPath();
        if (path == undefined || path == "404") {
            location.href = "/404.html";
        }
        var lang = getLanguage();

        for (var i in pages) {
            var page = pages[i];
            if (page.page == path) {
                getMarkdown(page.doc, lang);
            }

            getDropdown(page);
        }

        $("#lang a").click(function () {
            $.cookie("lang", $(this).attr("href").replace("?lang=", ""));
            location.reload();
            return false;
        });

        $("a.internal").click(function () {
            var url = $.url(this);

            var relative = url.attr("relative");
            history.pushState(null, null, relative);

            var href = url.attr("query");
            getContents(href, lang);

            var fragment = url.attr("fragment");
            return false;
        });

        $(window).on('popstate', function (e) {
            /*
            * Note, this is the only difference when using this library,
            * because the object document.location cannot be overriden,
            * so library the returns generated "location" object within
            * an object window.history, so get it out of "history.location".
            * For browsers supporting "history.pushState" get generated
            * object "location" with the usual "document.location".
            */
            var returnLocation = history.location || document.location;

            // here can cause data loading, etc.
            getContents(returnLocation.href, lang);
        });
    });

    // Gets the current path.
    var getCurrentPath = function() {
        var path = $.url().attr("path");
        if (path == undefined || path == "/") {
            path = "index";
            var query = $.url().attr("query");
            if (query != undefined && query.length) {
                path = query;
                if (!validatePage(path)) {
                    path = "404";
                }
            }
        }
        return path.replace("/", "");
    };

    // Validates whether the path provide is valid or not.
    var validatePage = function (path) {
        if (path == undefined || !path.length) {
            return false;
        }

        var validated = false;
        for (var i in pages) {
            var page = pages[i];
            if (page.page != path) {
                continue;
            }
            validated = true;
            break;
        }
        return validated;
    };

    // Gets the language from the query string.
    var getLanguage = function () {
        var lang = $.cookie("lang");
        if (lang == undefined || !lang.length) {
            lang = "en";
            $.cookie("lang", lang);
        }
        return lang;
    };

    // Gets the given markdown page.
    var getMarkdown = function (doc, lang) {
        var localistion = lang != "en" ? "localisation/" + lang + "/" : "";
        var url = "https://api.github.com/repos/aliencube/CSharp-Coding-Guidelines/contents/" + localistion + doc;
        $.ajax({
                type: "GET",
                url: url,
                dataType: "json"
            })
            .done(function(data) {
                var decoded = Base64.decode(data.content);
                markdownToHtml(decoded);
            });
    };

    // Converts the markdown to HTML and put them into the HTML element.
    var markdownToHtml = function (markdown) {
        var url = "https://api.github.com/markdown";
        var params = {
            "mode": "gfm",
            "text": markdown
        };
        $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(params),
                dataType: "html"
            })
            .done(function(data) {
                for (var i in pages) {
                    var doc = pages[i].doc;
                    var page = pages[i].page;
                    data = data.replace(doc, "?" + page);
                }
                $("#main-content").html(data);

                $("#main-content a[href^='?']").addClass("internal");
                $("h1").each(function (i) {
                    $(this).prepend($("<a></a>").attr("name", $(this).text().trim().toLowerCase().replace(/ /gi, "-")));
                });
                $("h2").each(function (i) {
                    $(this).prepend($("<a></a>").attr("name", $(this).text().trim().toLowerCase().replace(/ /gi, "-")));
                });
            });
    };

    // Gets the dropdown menu link.
    var getDropdown = function (page) {
        if (page.page == "index") {
            return;
        }
        var a = $("<a></a>").attr("href", "?" + page.page).addClass("internal").text(page.name);
        var li = $("<li></li>").append(a);
        $("#dropdown-menu").append(li);
    };

    // Gets the contents corresponding to the link, with history.pushState
    var getContents = function(href, lang) {
        if (href == undefined || !href.length) {
            return;
        }

        var path = href.substring(href.lastIndexOf("/") + 1);
        var page = getPage(path);
        if (page != undefined) {
            getMarkdown(page.doc, lang);
        }
    };

    // Gets the page corresponding to the path.
    var getPage = function (path) {
        var page = undefined;
        if (path == undefined) {
            return page;
        }

        for (var i in pages) {
            if (pages[i].page != path) {
                continue;
            }
            page = pages[i];
            break;
        }
        return page;
    };
})(jQuery);