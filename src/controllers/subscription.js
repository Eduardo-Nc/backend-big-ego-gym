const { response } = require('express');
const Subscription = require("../models/subscription");

const createSubscription = async (req, res = response) => {

    try {

        const resSub = new Subscription(req.body);

        await resSub.save();

        res.status(201).json({
            ok: true,
            msg: 'La membresía fue creada correctamente',
        })

    } catch (error) {
        console.error(error.message);
    }
}

const getSubscription = async (req, res = response) => {
    try {
        const resSub = await Subscription.find({
            status: true
        });

        if (!resSub) {
            return res.status(404).json({
                ok: false,
                message: 'No se encontraron membresías'
            })
        } else {
            return res.status(200).json(resSub);
        }

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }
}


const updatedSubscription = async (req, res = response) => {
    const { id } = req.params;
    const { name, typeSubscription, price, category } = req.body;

    try {

        const resSub = await Subscription.findByIdAndUpdate(
            id,
            {
                name,
                typeSubscription,
                price,
                category
            },
            {
                new: true,
            }
        );


        if (!resSub) {
            return res.status(404).json({
                ok: false,
                msg: 'Membresía no encontrada'
            })
        }
        else {
            return res.status(200).json({ ok: true, msg: 'Membresía actualizada correctamente' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }
}

const deactivateSubscription = async (req, res = response) => {

    const { id } = req.params;

    try {

        const resSub = await Subscription.findByIdAndUpdate(
            id,
            { status: false },
            {
                new: true,
            }
        );


        if (!resSub) {
            return res.status(404).json({
                ok: false,
                msg: 'Membresía no encontrada'
            })
        }
        else {

            return res.status(200).json({
                ok: true,
                msg: 'Membresía eliminada correctamente'
            });
        }



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Un error fue detectado, por favor habla con el administrador'
        })
    }


}





module.exports = {
    createSubscription,
    getSubscription,
    deactivateSubscription,
    updatedSubscription,
}