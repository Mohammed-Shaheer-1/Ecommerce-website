const mongoClient=require('mongodb').MongoClient
const state={
   db:null
}
module.exports.connect=function(done){
    const url='mongodb://localhost:27017'
    const dbname='shopping'
    mongoClient.connect(url,(error,data)=>{
        if(error) return done(error)
  
       state.db=data.db(dbname)
       done()
    })
}

module.exports.get=()=>{
    return state.db
}