app.post("/postregis", (req, res) => {
    let { email,uname, password,phone,address } = req.body;
    console.log(req.body)
    console.log(password)
    const hash = bcrypt.hashSync(password, saltRounds);
    console.log(hash)
    userModel.create({ email:email,username: uname, password: hash, phone:phone, address:address, status:0 })
        .then(data => {
            let mailOptions={
                from:'markjackman31820@gmail.com',
                to:email,
                subject:"Activation Account",
                template:'mail',
                context:{
                username:uname,
                id:data._id
                }
            }
            transporter.sendMail(mailOptions,(err,info)=>{
                if(err){ console.log(err)}
                else{
                    res.redirect("/login")
                }
            })
           
        })
        .catch(err => {
            res.render("regis", { error: "User Already Registered" })
        })

})