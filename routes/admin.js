var express = require('express');
const { Db } = require('mongodb');
var router = express.Router();
var producthelpers = require('../helpers/product-helper')
var db=require('../confiq/connection')
var collections=require('../confiq/collections')
var objctId=require('mongodb').ObjectId




/* GET users listing. */

var loggedinn=(req,res,next)=>{


  if(req.session.admin){
    next()
  }else{
    res.render('admin/adminlogin',{admin:true})
  }
}

router.get('/',loggedinn,async function  (req, res, next) {
 await producthelpers.getAllproducts().then((products)=>{
    res.render('admin/view-products', { admin: true, products ,ad:req.session.admin});
  })
 
});
router.get('/add-product', (req, res) => {
  res.render('admin/add-product',{admin: true,ad:req.session.admin})
})

router.post('/add-product', (req, res) => {
  // console.log(req.body);
  console.log("image", req.files.image);
  producthelpers.addproduct(req.body,(id)=>{
    let image=req.files.image
    console.log(id);
    image.mv('./public/product-imges/'+id+'.jpg',(err,data)=>{
    if(!err){
      res.render('admin/add-product',{admin: true})
    }else{
      console.log(err);
    }
    })
 
  })
})

router.get('/delete-product/:id',(req,res)=>{
//  let id= req.query.id
//  let name=req.query.name
let proId=req.params.id
console.log("id",proId);
db.get().collection(collections.product_collction).deleteOne({_id:objctId(proId)},(err,data)=>{
  if(err){
    console.log("err",err);
  }else{
    console.log("data",data);
    res.redirect('/admin/')
  }
})
})



// producthelpers.deleteproduct(proId).then((response)=>{

// })

router.get('/edit-product/:id', (req, res) => {
  let product=req.params.id
  db.get().collection(collections.product_collction).findOne({_id:objctId(product)}).then((product)=>{
   
    res.render('admin/edit-product',{product,admin: true,ad:req.session.admin})
  })
})

router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  let data=req.body
  db.get().collection(collections.product_collction).updateOne({_id:objctId(id)},{
    $set:{
      name:req.body.name,
      categery:req.body.categery,
      price:req.body.price,
      discription:req.body.discription
    }
  }).then((response)=>{
    // console.log(response);
    
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      let id=req.params.id
      image.mv('./public/product-imges/'+id+'.jpg')//automatically reawright
    }else{
      res.redirect('/admin')
    }

  })
})






router.post('/adminlogin', (req, res) => {

  producthelpers.doLogin(req.body).then((result) => {
    if (result.status) {
    
      req.session.admin = result.data
      req.session.admin.loggedin = true
      res.redirect('/admin/')
   
    } else {
    //  let ad=req.session.admin=null
      req.session.adminloginErr="Invalid adminId Or password"
      res.render('admin/adminlogin',{"loginerr":req.session.adminloginErr,ad:req.session.admin,admin:true})
    }
  })
});


router.get('/orders',(req,res)=>{
 producthelpers.getOrderList().then((order)=>{

  let newArry=order.filter((value)=>value.status=='placed')

  res.render('admin/order',{admin:true,ad:req.session.admin,newArry})
 })
})


router.get('/order/:id',async(req,res)=>{
console.log("hello");

 await producthelpers.changeStatus(req.params.id).then(()=>{

 res.redirect('/admin/orders')
})

})


module.exports = router;
