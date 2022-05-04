// ==UserScript==
// @name         Ehentai Uploader Smart Sort
// @namespace    https://github.com/Grinch27
// @version      0.1.6
// @description  help Ehentai Uploader Sort uploade-Img Smarter!
// @icon            https://e-hentai.org/favicon.ico
// @author       Grinch27
// @match      *://exhentai.org/upld/*
// @match      *://upld.e-hentai.org/*
// @exclude      https://exhentai.org/upld/manage
// @exclude      https://upld.e-hentai.org/manage
// @icon         none
// @grant        none
// @copyright       2022, Grinch27 (https://github.com/Grinch27)
// @license         GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0-standalone.html
// @homepageURL https://github.com/Grinch27/EH-Uploader-Toolkit/blob/main/Ehentai%20Uploader%20Smart%20Sort.js
// @run-at document-end
// ==/UserScript==

/**
 * @author Grinch27
 * @copyright Grinch27
 * @license GNU General Public License v3.0 or later
 *
 * GNU General Public License
 * <https://www.gnu.org/licenses/>.
 */

 (function() {
    'use strict';
    // class define
    class onclickJump_Button {
        constructor (innerHTML) {
            this.innerHTML = innerHTML;
            this.Button = document.createElement('button');
            this.Button.innerHTML = innerHTML;
            this.Button.setAttribute("class", 'Tampermonkey');
        }
        onclickJump (URL) {
            this.Button.setAttribute("href", URL);
            this.Button.setAttribute("onclick", `javascript:window.open('${URL}')`);
            this.Button.setAttribute("class", 'Tampermonkey-Jump');
        }
        clickToCopy (str_copy) {
            this.Button.setAttribute('id', 'copy_btn');
            this.Button.setAttribute("data-clipboard-text", str_copy);
            this.Button.setAttribute("class", 'Tampermonkey-Copy');
        }
        append (Node) {
            Node.appendChild(this.Button);
        }
    }

    class EhentaiManageCell {
        constructor (cell_node) {
            this.cell_id_ = null;
            this.cell_href_ = null;
            this.span_id_ = null;
            this.span_value_ = null;
            this.img_id_ = null;
            this.img_alt_ = null;
            this.img_src_ = null;
            this.series_ = null;
            this.index_ = null;
            this.SetCellNode(cell_node);
        }

        SetCellNode (cell_node) {
            this.cell_id_ = cell_node.getAttribute('id');
            this.SetSpanNode(cell_node.querySelector('input'));
            this.SetImgNode(cell_node.querySelector('img'));
            this.SetHrefNode(cell_node.querySelector('a[href]'));
        }

        SetSpanNode (span_node) {
            this.span_id_ = span_node.getAttribute('id');
            this.span_value_ = Number(span_node.getAttribute('value'));
        }

        SetImgNode (img_node) {
            this.img_id_ = img_node.getAttribute('id');
            this.img_alt_ = img_node.getAttribute('alt');
            this.img_src_ = img_node.getAttribute('src');
            this.MatchSeriesIndex(this.img_alt_.match(/\d+/g));
        }

        MatchSeriesIndex (match_array) {
            if (match_array != null) {
                switch (match_array.length) {
                    case 1:
                        this.series_ = Number(match_array[0]);
                        this.index_ = 0;
                        break
                    default:
                        this.series_ = Number(match_array[0]);
                        this.index_ = Number(match_array[1]);
                        break
                }
            }
        }

        SetHrefNode (href_node) {
            if (href_node != null) {
                this.cell_href_ = href_node.getAttribute('href');
                let temp_href = this.cell_href_.split('/').slice(-2)[0];
                this.cell_href_ = this.cell_href_.replace(temp_href, temp_href.match(/.{10}/gi)[0]);
                temp_href = undefined;
            } else {
                this.cell_href_ = null;
            }
        }
    }

    function dynamicSort (property) {
        let sortOrder = 1;
        if (property[0] === '-') {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a,b) {
            /* next line works with strings and numbers,
             * and you may want to customize it to your needs
             */
            let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder
        }
    }

    function dynamicSortMultiple () {
        /* refer: sort-array-of-objects-by-string-property-value
         * save the arguments object as it will be overwritten
         * note that arguments object is an array-like object
         * consisting of the names of the properties to sort by
         */
        let props = arguments;
        return function (obj1, obj2) {
            let i = 0, result = 0; const numberOfProperties = props.length;
            /* try getting a different result from 0 (equal)
             * as long as we have extra properties to compare
             */
            while(result === 0 && i < numberOfProperties) {
                result = dynamicSort(props[i])(obj1, obj2);
                i++;
            }
            return result
        }
    }

    function removeDuplicatesFromArrayOfObjects (target_array, property) {
        // refer: how-to-remove-all-duplicates-from-an-array-of-objects
        return target_array.filter((v, i, a) => a.findIndex(v2 => (v2[property] === v[property])) === i) // or .findLastIndex
    }

    function mergeArrayToLeft (left_array, right_array, property) {
        // refer: combine-json-arrays-by-key-javascript
        return left_array.map(x => Object.assign(x, right_array.find(y => y[property] == x[property]))); //merge to left
    }

    function countSeriesDuplicates (data_array) {
        let property = 'series_';
        // refer: javascript-counting-duplicates-in-object-array-and-storing-the-count-as-a-new
        // refer: get-duplicates-in-array-of-strings-and-count-number-of-duplicates
        let res_count = Object.values(
            data_array.reduce(
                function (elem, { series_ }) {
                    elem[series_] = elem[series_] || { series_, count: 0 };
                    elem[series_].count++;
                    return elem
                }, Object.create(null)
            )
        );
        data_array = mergeArrayToLeft(data_array, res_count, property);
        // TODO: upgrade series_ and count(need_) to property(varialbe)
        return data_array
    }

    function scanCellInfo (cell_selector) {
        // collect img_cell to json_array
        let cell_node_array = document.querySelectorAll(cell_selector);
        let cell_json_array = [];
        for (let i = 0, cell_node; cell_node = cell_node_array[i]; i++) {
            cell_node = new EhentaiManageCell(cell_node);
            cell_json_array.push(JSON.parse(JSON.stringify(cell_node)))
        }
        cell_json_array = countSeriesDuplicates(cell_json_array)
        alert(`${cell_json_array.length} ImgCell Scanned`);
        // Data log for Scan debug
        let property = 'series_'
        let series_cell_array = removeDuplicatesFromArrayOfObjects (cell_json_array, property)
        console.log(series_cell_array);
        return cell_json_array
    }

    function sortPageselCell () {
        let cell_json_array = scanCellInfo('div[id^="cell"]');
        // sort the json array
        cell_json_array.sort(dynamicSortMultiple("-series_", "index_"));
        // convert json_array to text ready for POST 
        let post_text = 'do_reorder=manual';
        for (let i = 0, each_param; each_param = cell_json_array[i]; i++) {
            post_text += `&${each_param.span_id_}=${i+1}`;
        }
        post_text += '&autosort=';
        return post_text
    }

    function postEhentaiManageSort (post_text) {
        if (document.URL.search(/(?<=(ulgid\=))\d+/gi) == -1) {
            alert("Not ulgid Page!\nAbort Post!");
        } else {
            let ulgid_num = document.URL.match(/(?<=(ulgid\=))\d+/gi)[0];
            let domain_org = document.URL.replace(/.*\/\//gi, '').replace(/managegallery.*/gi, '');
            try {
                fetch(`https://${domain_org}managegallery?ulgid=${ulgid_num}`, {
                    method: 'POST',
                    headers: {
                        'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                        'Content-Type': 'application/x-www-form-urlencoded',
                        //'queryString': JSON.stringify({'ulgid': ulgid_num}),
                        //'Cookie': document.cookie,
                        'Cache-Control': 'max-age=0',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': 1,
                    },
                    body: JSON.parse(JSON.stringify(post_text))
                })
                alert("POST OK\nPlease Reflash");
            } catch {
                alert("POST fail!");
            }
        }
    }

    function userBoard (name_sortBoard) {
        //let name_sortBoard = 'SmartSort';

        let user_flexbox = document.createElement('flexbox');
        user_flexbox.setAttribute('class', `Tampermonkey-${name_sortBoard}`);
        user_flexbox.style = 'display: flex; flex-direction: row; justify-content: center; align-items: center;'
        document.querySelector('a[name="reorder"]').appendChild(user_flexbox)

        let style_EHbutton = "min-height: 26px; line-height: 20px; padding: 1px 5px 2px; border: 2px solid #8d8d8d; border-radius: 3px; opacity: 1.0;";
        let id_ScanSmart = 'scan-smart';
        let id_PostSmart = 'post-smart';

        let button_sort = new onclickJump_Button("Scan Smart");
        button_sort.Button.style = style_EHbutton;
        button_sort.Button.setAttribute("id", `${id_ScanSmart}`);
        button_sort.Button.onclick = function(){
            document.querySelector(`button[id="${id_ScanSmart}"]`).value = sortPageselCell();
        };
        button_sort.append(document.querySelector(`flexbox[class="Tampermonkey-${name_sortBoard}"]`));

        let button_post = new onclickJump_Button("Post Smart");
        button_post.Button.style = style_EHbutton;
        button_post.Button.setAttribute("id", `${id_PostSmart}`);
        button_post.Button.onclick = function(){
            let post_text = document.querySelector(`button[id="${id_ScanSmart}"]`).value;
            if (post_text.search(/autosort/gi) != -1){
                postEhentaiManageSort(post_text);
            } else {
                alert("Scan Error!\nAbort Post!\nPlease check Scan Smart Button Value");
            }
        }
        button_post.append(document.querySelector(`flexbox[class="Tampermonkey-${name_sortBoard}"]`));
    }
    // run
    userBoard('SmartSort');
})();
