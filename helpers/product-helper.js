var db=require('../confiq/connection')
var collections=require('../confiq/collections')
const bcrypt = require('bcrypt')
const promise = require('promise')
const { response } = require('express')
var objctId=require('mongodb').ObjectId
module.exports = {

    addproduct: (product,callback) => {
        console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{

         callback(data.insertedId.toString())
        })
    },
    getAllproducts:()=>{
        return new Promise(async(resolve,rejuct)=>{
            let products=await db.get().collection(collections.product_collction).find().toArray()
            resolve(products)
        })
    },
    
    // deleteproduct:(proId)=>{
       
    //    return new Promise((resolve,rejuct)=>{
    //     db.get().collection(collections.product_collction).removeOne({_id:objctId(proId)}).then((response)=>{
    //         console.log(response);
    //         response(response)
    //     })
    //    })
    // }


    doLogin: (admindata) => {
        return new promise(async (resolve, rejuct) => {
           let response = {}
           let data = await db.get().collection(collections.admin_collection).findOne({ "adminId": admindata.adminId })
  
           if (data) {
  console.log(data);
          
                 if (admindata.password==data.password) {
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
            
           } else {
              console.log("incorrect mail");
              resolve({ status: false })
           }
        })
  

},
getOrderList:()=>{
    return new promise((resolve,rejuct)=>{
     let order=db.get().collection(collections.order_collection).find().toArray()
 resolve(order)
 
 
    })

},
changeStatus:(orderId)=>{
  return new promise((resolve,rejuct)=>{
    db.get().collection(collections.order_collection).updateOne({_id:objctId(orderId),status:'placed'},
         {
            $set:{
                status:'shipped'
            }
         }
    ).then((response)=>{
        resolve()
    })
  })
}

}