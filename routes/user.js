const { response } = require('express');
var express = require('express');
const session = require('express-session');
var router = express.Router();
var producthelpers = require('../helpers/product-helper')
var userhelpers = require('../helpers/user-helpers')
 
var loggedin=(req,res,next)=>{
  if(req.session.userLoggedin){
    next()
  }else{
    res.render('user/login')
  }
}

/* GET home page. */
router.get('/',async function (req, res, next) {
  let user = req.session.user
  let cartCount=null
if(req.session.user){
 cartCount= await userhelpers.cartCount(req.session.user._id)


}

  producthelpers.getAllproducts().then((products) => {
    res.render('user/view-user', { products, user ,cartCount});
  })
});

router.get('/login', (req, res) => {
  console.log(req.session.user);
  if(req.session.user){//it's true 
    res.redirect('/')
  }else{
    
    res.render('user/login',{"loginErr":req.session.userloginErr});
    req.session.userloginErr=false
  }

});

router.get('/signup', (req, res) => {
  res.render('user/signup');
});

router.post('/signup', (req, res) => {
  console.log(req.body);
  userhelpers.doSignup(req.body).then((newuser) => {
    console.log("user", newuser);
    
    req.session.user=newuser
    req.session.userLoggedin=true
    res.redirect('/')
  })
});           
 
router.post('/login', (req, res) => {
  userhelpers.doLogin(req.body).then((result) => {
    if (result.status) {
    
      req.session.user = result.data
      req.session.userLoggedin = true
      res.redirect('/')
    } else {
      
      req.session.userloginErr="Invalid username Or password"
      res.redirect('/login')
    }
  })
});

router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.userLoggedin = false
  res.redirect('/')
})

router.get('/cart',loggedin,async(req,res)=>{

  let products=await userhelpers.getCartProducts(req.session.user._id)
  let totalValue=0
  if(products.length>0){
    totalValue = await userhelpers.getTotalAmount(req.session.user._id)
  }
 
  // console.log("products",products);
//  console.log("***",req.session.user._id);
  // console.log("p",products);
  // let pro=products[0].cartItems
  // let user=req.session.user
  res.render('user/cart',{products,user:req.session.user,totalValue})
})

router.get('/add-to-cart/:id',(req,res)=>{
console.log("hi api");
   userhelpers.addToCart(req.params.id,req.session.user._id).then((resp)=>{
 
    res.json({status:true})
    // res.redirect('/')

   })

})

router.post('/change-product-quantity',(req,res,next)=>{
// console.log(req.body);
  userhelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.totalValue = await userhelpers.getTotalAmount(req.body.userId)
res.json(response)//response convert to json format to cart ajax
  })
})


router.post('/remove-cart',(req,res,next)=>{
  // console.log(req.body);
  userhelpers.removeCart(req.body).then((response)=>{
    // console.log(response)
    res.json(response)
   
  })
})

router.get('/place-order',loggedin,async(req,res)=>{
 await userhelpers.getTotalAmount(req.session.user._id).then((total)=>{
  res.render('user/place-order',{total,user:req.session.user})
  })

})

router.post('/place-order',async(req,res)=>{
  let products=await userhelpers.getCartproductList(req.body.userId)//user is user id
  let totalPrice= await userhelpers.getTotalAmount(req.body.userId)//user is user id
  userhelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']=='COD'){
      res.json({codsuccess:true})
    }else{
    userhelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
      res.json(response)
    })
    }

  })
  // console.log("body",req.body);
})

router.get('/order-added',(req,res)=>{
  res.render('user/order-added',{user:req.session.user})
})
router.get('/show-order',async(req,res)=>{
 
  let showOrder=await userhelpers.getOrderList(req.session.user._id)

    res.render('user/show-order',{user:req.session.user,showOrder})

 
})

router.get('/show-order-products/:id',async(req,res)=>{
 let products= await userhelpers.getOrderProducts(req.params.id)
  res.render('user/showorder-products',{products}) 
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userhelpers.verifyPayment(req.body).then(()=>{
    userhelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
     console.log("payment success full");
      res.json({status:true})
    }) 
  }).catch((err)=>{

    console.log(err);
   res.json({status:false,err:'faild'})
  })
})

module.exports = router;
 