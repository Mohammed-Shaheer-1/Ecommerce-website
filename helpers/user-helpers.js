var db = require('../confiq/connection')
var collections = require('../confiq/collections')
const bcrypt = require('bcrypt')
const promise = require('promise')
const { response } = require('express')
const { resolve, reject } = require('promise')
var objctId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
//create intstance
var instance = new Razorpay({
   key_id: 'rzp_test_fU1NyGogFmswXO',
   key_secret: 'IoNqsCRPXqGZDBB3XZq9w2Ws'
})
module.exports = {
   doSignup: (userdata) => {
      return new promise(async (resolve, rejuct) => {
         userdata.password = await bcrypt.hash(userdata.password, 10)
         db.get().collection(collections.user_collection).insertOne(userdata).then((data) => {

            resolve(userdata)
         })


      })

   },
   doLogin: (userdata) => {
      return new promise(async (resolve, rejuct) => {
         let response = {}
         let data = await db.get().collection(collections.user_collection).findOne({ "email": userdata.email })

         if (data) {

            bcrypt.compare(userdata.password, data.password).then((user) => {
               if (user) {
                  console.log("login success");
                  console.log("data", data);
                  response.data = data

                  response.status = true
                  console.log("res", response);
                  resolve(response)
               } else {
                  console.log("login faild");
                  resolve({ status: false })
               }
            })
         } else {
            console.log("incorrect mail");
            resolve({ status: false })
         }
      })



   },
   addToCart: (productId, userId) => {
      let proObj = {
         item: objctId(productId),
         quantity: 1
      }
      return new promise(async (resolve, rejuct) => {
         let usercart = await db.get().collection(collections.cart_collection).findOne({ user: objctId(userId) })
         if (usercart) {
            let proExist = usercart.product.findIndex(pro => pro.item == productId)
            console.log(proExist);
            if (proExist != -1) {
               db.get().collection(collections.cart_collection).
                  updateOne({ user: objctId(userId), 'product.item': objctId(productId) },
                     {
                        $inc: { 'product.$.quantity': 1 }
                     }
                  ).then((respose) => {
                     resolve()
                  })
            } else {
               db.get().collection(collections.cart_collection).updateOne({ user: objctId(userId) }, {
                  $push: { product: proObj }
               }).then((response) => {
                  resolve()
               })
            }


         } else {
            let cartobj = {
               user: objctId(userId),
               product: [proObj]
            }
            db.get().collection(collections.cart_collection).insertOne(cartobj).then((response) => {

               resolve()
            })
         }
      })
   },
   getCartProducts: (userdId) => {
      return new promise(async (resolve, rejuct) => {
         let cartitems = await db.get().collection(collections.cart_collection).aggregate([
            {
               $match: { user: objctId(userdId) }
            },
            {
               $unwind: '$product'
            },
            {
               $project: {
                  item: '$product.item',
                  quantity: '$product.quantity'
               }                                                                          
            },
            {
               $lookup: {
                  from: collections.product_collction,
                  localField: 'item',
                  foreignField: '_id',
                  as: 'product'
               }
            }, {
               $project: {                        //product ine take outside
                  item: 1,
                  quantity: 1, product: { $arrayElemAt: ['$product', 0] }   //nex out putil show cheyyendath 1 show cheyyandaathath 0
               }
            }
            //eg samble= [
            //   {
            //    _id: new ObjectId("636a6f8a143714f7a66af250"),
            //    item: new ObjectId("6363fe2eb2884c62df9e2e42"),
            //    quantity: 2,
            //    product: {
            //      _id: new ObjectId("6363fe2eb2884c62df9e2e42"),
            //      name: 'iphon14promax',
            //      categery: 'mobile',
            //      price: '10000',
            //      discription: 'goodphon'
            //    }
            //  },
            //  {
            //    _id: new ObjectId("636a6f8a143714f7a66af250"),
            //    item: new ObjectId("636400f703c7cad5611cb71a"),
            //    quantity: 3,
            //    product: {
            //      _id: new ObjectId("636400f703c7cad5611cb71a"),
            //      name: 'iphon  7plus',
            //      categery: 'mobile',
            //      price: '30000',
            //      discription: 'good'
            //    }
            //  }
            // ]
            // {
            //    $lookup: {
            //       from: collections.product_collction,
            //       let: { productList: '$product' },
            //       pipeline: [
            //          {
            //             $match: {
            //                $expr: {
            //                   $in: ['$_id', "$$productList"]
            //                }
            //             }
            //          }
            //       ],
            //       as: 'cartItems'

            //    }
            // }
         ]).toArray()
         // console.log("cart",cartitems);
         resolve(cartitems)
      })
   },
   cartCount: (userId) => {
      return new promise(async (resolve, rejuct) => {
         let count = 0
         let cart = await db.get().collection(collections.cart_collection).findOne({ user: objctId(userId) })
         if (cart) {
            count = cart.product.length

         }
         resolve(count)
      })


   },
   changeProductQuantity: (details) => {
   //  console.log(details);
      details.count = parseInt(details.count)
      details.quantity = parseInt(details.quantity)

      return new promise((resolve, rejuct) => {
         if (details.count == -1 && details.quantity == 1) {//remove cart
            db.get().collection(collections.cart_collection).
               updateOne({ _id: objctId(details.cart) },
                  {
                     $pull: { product: { item: objctId(details.product) } }//remove item
                  }
               ).then((response) => {
                  resolve({ removeProduct: true })
               })
         } else {
            db.get().collection(collections.cart_collection).
               updateOne({ _id: objctId(details.cart), 'product.item': objctId(details.product) },
                  {
                     $inc: { 'product.$.quantity': details.count }//incriment 
                  }
               ).then((response) => {
                  resolve({ status: true })
               })
         }

      })
   },
   removeCart: (data) => {
      return new promise((resolve, rejuct) => {
         db.get().collection(collections.cart_collection).updateOne({ _id: objctId(data.cartId) },
            {
               $pull: { product: { item: objctId(data.proId) } }
            }).then((response) => {

               resolve({ status: true })
            })
      })

   },
   getTotalAmount: (userId) => {
      return new promise(async (resolve, rejuct) => {
         let total = await db.get().collection(collections.cart_collection).aggregate([
            {
               $match: { user: objctId(userId) }
            },
            {
               $unwind: '$product'
            },
            {
               $project: {
                  item: '$product.item',
                  quantity: '$product.quantity'
               }
            },
            {
               $lookup: {
                  from: collections.product_collction,
                  localField: 'item',
                  foreignField: '_id',
                  as: 'product'
               }
            }, {
               $project: {                        //product ine take outside
                  item: 1,
                  quantity: 1, product: { $arrayElemAt: ['$product', 0] }   //nex out putil show cheyyendath 1 show cheyyandaathath 0
               }
            },
            {
               // $project
               $group: {
                  _id: null,
                  total: {
                     $sum: {
                        $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }]
                        // ['$quantity','$product.price']
                     }
                  }
               }
            }


         ]).toArray()

         let totalAmount = total[0].total
         resolve(totalAmount)
      })

   },
   placeOrder: (order, products, total) => {
      return new promise((resolve, rejuct) => {
         let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
         let orderDate = new Date(order.date).toDateString();
         let orderObj = {
            deliveryDetails: {
               mobile: order.mobile,
               pincode: order.pincode,
               address: order.address,
               date: orderDate
            },
            userId: objctId(order.userId),
            paymentMethod: order['payment-method'],
            product: products,
            totalAmount: total,
            status: status
         }
         db.get().collection(collections.order_collection).insertOne(orderObj).then((response) => {
            db.get().collection(collections.cart_collection).deleteOne({ user: objctId(order.userId) })
            console.log(response);
            resolve(response.insertedId)
         })
      })
   },
   getCartproductList: (userId) => {
      return new promise(async (resolve, rejuct) => {
         let cart = await db.get().collection(collections.cart_collection).findOne({ user: objctId(userId) })
         console.log(cart);
         resolve(cart.product)
      })
   },
   getOrderList: (userId) => {
      return new promise((resolve, rejuct) => {
         db.get().collection(collections.order_collection).find({ userId: objctId(userId) }).toArray().then((res) => {
            // console.log("order", res);
            resolve(res)
         })

      })
   },
   getOrderProducts: (orderId) => {
      return new promise(async (resolve, rejuct) => {
         let orderitems = await db.get().collection(collections.order_collection).aggregate([
            {
               $match: { _id: objctId(orderId) }
            },
            {
               $unwind: '$product'
            },
            {
               $project: {
                  item: '$product.item',
                  quantity: '$product.quantity'
               }
            },
            {
               $lookup: {
                  from: collections.product_collction,
                  localField: 'item',
                  foreignField: '_id',
                  as: 'product'
               }
            }, {
               $project: {                        //product ine take outside
                  item: 1,
                  quantity: 1, product: { $arrayElemAt: ['$product', 0] }   //nex out putil show cheyyendath 1 show cheyyandaathath 0
               }
            }

         ]).toArray()
         // console.log(orderitems);
         resolve(orderitems)
      })
   },
   generateRazorpay: (orderId,totalPrice) => {
      return new promise((resolve, rejuct) => {
         var options={
            amount: totalPrice*100,
            currency: "INR",
            receipt:""+orderId 
         }
         instance.orders.create(options,(err,order)=>{
            console.log("order",order);
           
            resolve(order)
         })
      })
   },
   verifyPayment:(details)=>{

      return new promise((resolve,reject)=>{
     
         const crypto=require('crypto')                                   //crypto node
         let hamac =crypto.createHmac('sha256','IoNqsCRPXqGZDBB3XZq9w2Ws')//secret key
         hamac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])//append
          hamac=hamac.digest('hex')//hamac covert hexa code here hex code verify
 
          if(hamac==details['payment[razorpay_signature]']){
          
            resolve()
          }else{
         
            reject()
          }

      })

   },
   changePaymentStatus:(orderId)=>{
     return new promise((resolve,reject)=>{
      db.get().collection(collections.order_collection).updateOne({_id:objctId(orderId)},
      {
         $set:{
            status:"placed"
         }
      }).then(()=>{
         resolve()
      })
     })
   }

}
// notes: {
//    key1: "value3",
//    key2: "value2"
// }