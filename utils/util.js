// http(s)://dev.countinsight.com/list.json
const config = {
    header: {
      'content-type': 'application/json'
    },
    img_prefix: 'https://img.countinsight.com', // 图片地址
    search_url: 'https://yuedu.baidu.com/search/booksearchasync?' // api  地址
    
   
}

const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}



const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}


const resReady = (res) => {

    return new Promise((resolve, reject) => {
        if (res.data.code == 0) {
            resolve()
        } else {
            reject()
        }

    })


}



const WX = {}

/***实现promise的finally方法**/
Promise.prototype.finally = function(callback) {
    let P = this.constructor;
    return this.then(
        value => P.resolve(callback()).then(() => value),
        reason => P.resolve(callback()).then(() => { throw reason })
    )
}

/**
 * 将小程序的API封装成支持Promise的API
 * @params fn {Function} 小程序原始API，如wx.login
 */

const wxPromisify = (fn) => {
    return function(obj = {}) {
        return new Promise((resolve, reject) => {
            obj.success = (res) => {
                resolve(res)
            }
            obj.fail = (res) => {
                reject(res)
            }
            console.log(fn)
            wx[fn](obj)
        })
    }
}

const wxApi = ['showModal', 'downloadFile', 'chooseImage', 'scanCode']

wxApi.forEach((value) => {

    WX[value] = wxPromisify(value); //弹窗

})

const redirectToLogin = () => {

    console.log('重定向到登录页')
    wx.redirectTo({ 'url': '/pages/login/login' })

}


/**封装request请求**/
const request = (url, data, method) => {
    return new Promise((resolve, reject) => {
        wx.request({
            url: url,
            data: data,
            method: method,
            header: config.header,
            success: function(res) { //服务器返回数据
                if (res.statusCode == 200) {
                    resolve(res)
                } else if (res.statusCode == 403) {

                    reject('未登录')
                    // redirectToLogin()

                } else { //返回错误提示信息
                    reject(res.data)
                }
            },
            error: function(e) {
                reject('网络出错' + e)
            }
        })
    })
}

/**封装GET请求**/
WX.get = (url, data) => {
    return request(url, data, 'get')
}

/**封装POST请求**/
WX.post = (url, data) => {
    return request(url, data, 'POST')
}


WX.uploadFile = (filePath, formData) => {

    return new Promise((reslove, reject) => {

        wx.uploadFile({
            url: config.api_prefix + '/api/business/fileupload/image', //仅为示例，非真实的接口地址
            filePath: filePath,
            name: 'file',
            formData: formData || {},
            success(res) {
                reslove(JSON.parse(res.data))
            },
            fail(err) {
                reject(err)
            }
        })


    })

}



/**input 双向数据绑定 input 需要自定义属性 data-key=
'变量名' **/
const inputDuplex = function(e) {
    console.log(e, e.currentTarget.dataset.key)
    let context = this
    let name = e.currentTarget.dataset.key;
    let nameMap = {}
    nameMap[name] = e.detail.value || e.detail
    context.setData(nameMap)
}


/**抛物线公式**/

const bezier = function(pots, amount) {
    var pot;
    var lines;
    var ret = [];
    var points;
    for (var i = 0; i <= amount; i++) {
        points = pots.slice(0);
        lines = [];
        while (pot = points.shift()) {
            if (points.length) {
                lines.push(pointLine([pot, points[0]], i / amount));
            } else if (lines.length > 1) {
                points = lines;
                lines = [];
            } else {
                break;
            }
        }
        ret.push(lines[0]);
    }

    function pointLine(points, rate) {
        var pointA, pointB, pointDistance, xDistance, yDistance, tan, radian, tmpPointDistance;
        var ret = [];
        pointA = points[0]; //点击
        pointB = points[1]; //中间
        xDistance = pointB.x - pointA.x;
        yDistance = pointB.y - pointA.y;
        pointDistance = Math.pow(Math.pow(xDistance, 2) + Math.pow(yDistance, 2), 1 / 2);
        tan = yDistance / xDistance;
        radian = Math.atan(tan);
        tmpPointDistance = pointDistance * rate;
        ret = {
            x: pointA.x + tmpPointDistance * Math.cos(radian),
            y: pointA.y + tmpPointDistance * Math.sin(radian)
        };
        return ret;
    }
    return {
        'bezier_points': ret
    };
}


/**获取用户地理位置**/

const getUserLocation = function() {

    return new Promise((resolve, reject) => {

        wx.getLocation({
            type: 'wgs84',
            success(res) {
                const latitude = res.latitude
                const longitude = res.longitude

                wx.request({
                    url: 'https://apis.map.qq.com/ws/geocoder/v1/?key=FKRBZ-RK4WU-5XMV4-B44DB-D4LOH-G3F73&get_poi=1',
                    data: {
                        location: latitude + ',' + longitude
                    },
                    method: 'get',
                    success: (res) => {
                        console.log(res)
                        let map = res.data.result.address_component
                        console.log(map)
                        resolve(map)

                    },
                    fail: (err) => {
                        reject(err)
                    }

                })

            }
        })



    })

}


const checkMobile = function() {

    const useInfo = wx.getStorageSync('userInfo')

    console.log('checkMobile', useInfo)

    const pages = getCurrentPages()
    const url = pages[pages.length - 1].route
    const id = pages[pages.length - 1].options.id

    // wx.navigateTo({
    //    url:'/pages/login/login?url='+url+'&id='+id
    //  })

    if (!useInfo || !useInfo.user_bind_phone) {
        wx.navigateTo({
            url: '/pages/login/login?url=' + url + '&id=' + id
        })
        return
    }


}

const urlEncode = function(param, key, encode) {
    if (param == null) return '';
    var paramStr = '';
    var t = typeof(param);
    if (t == 'string' || t == 'number' || t == 'boolean') {
        paramStr += key + '=' + ((encode == null || encode) ? encodeURIComponent(param) : param) + '&';
    } else {
        for (var i in param) {
            var k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i);
            paramStr += urlEncode(param[i], k, encode);
        }
    }
    return paramStr;
};

/**

 * 返回分享配置

 * @method

 * @param {title} [i=0] 位置下标。如果为负数，则从集合的最后一个元素开始倒数

 * @return {Element} 指定元素

 */
const shareConfig = function(opt) {
    console.log('currentPage', getCurrentPages())
    let user = wx.getStorageSync('userInfo');

    var nick_name = user.user_info_nick_name

    var title = opt.title.replace('{{nick_name}}', nick_name)
    return function() {

        var pages = getCurrentPages() //获取加载的页面


        var currentPage = pages[pages.length - 1] //获取当前页面的对象
        console.log('currentPage', currentPage)

        var pageurl = currentPage.route //当前页面url
        var options = currentPage.options //如果要获取url中所带的参数可以查看options
        options.from_uid = user.user_id
        var params = urlEncode(options)


        console.log('pageurl', pageurl)
        console.log('params', params)

        console.log('/' + pageurl + '?' + params)

        console.log({
            title: title,
            path: '/' + pageurl + '?' + params,
            imageUrl: opt.imageUrl
        })

        return {
            title: title,
            path: '/' + pageurl + '?' + params,
            imageUrl: opt.imageUrl
        }



    }


}


/**

 * 设置父页面数据并返回
 * @method
 * @param {data} 需要设置的data
 
 * @return null
 * 
 */

const setParentData = function(data) {

    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1]; //当前页面
    var prevPage = pages[pages.length - 2]; //上一个页面
    // 直接调用上一个页面的setData()方法，把数据存到上一个页面中去

        prevPage.setData(data, () => {
            console.log('赋值成功',data)
            wx.navigateBack({
                delta: 1
            })
        })







}









module.exports = {
    formatTime,
    wx: WX,
    inputDuplex,
    resReady,
    bezier,
    config,
    getUserLocation,
    checkMobile,
    shareConfig,
    setParentData
}