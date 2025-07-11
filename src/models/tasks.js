const { Schema, model } = require('mongoose');

const TasksSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    endDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    userProgress: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'Users',
                required: true
            },
            completed: {
                type: Boolean,
                default: false
            }
        }
    ],
    status: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = model('task', TasksSchema);
