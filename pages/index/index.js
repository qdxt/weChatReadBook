//index.js
//获取应用实例
const app = getApp()
const util = require('../../utils/util.js')

Page({
	data:{
		bookList:[
			
		]

		
	},
  
  onConfirm:function(e){
  	util.wx.get('https://yuedu.baidu.com/search/booksearchasync',{word:e.detail.value},function(res){
  		console.log(res,'res')
  	})
    
  },
  
  
  onLoad: function () {
   	console.log(util.wx,'util')
  }
  
})
