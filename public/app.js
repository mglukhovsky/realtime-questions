$(function() {
    app.askQuestion = new Vue({
        el: "#new-question",
        methods: {
            // New question asked using the input box
            askQuestion: function(e) {
                $q = $(e.target);
                app.addQuestion($q.val());
                $q.val('');
            }
        }
    })

    app.list = new Vue({
        el: "#questions",
        data: {
            questions: []

        },
        methods: {
            upvoteQuestion: function(e) {
                e.preventDefault();
                app.upvoteQuestion(e.targetVM.$data.id);
            }
        }
    });

    app.socket = io.connect();

    app.socket.on('load questions', function(data) {
        console.log(data);
        app.list.$data.questions = data;

    });

    app.socket.on('questions', function(data) {
        console.log(data);

        // Update the list of questions
        questions = app.list.$data.questions;

        // Adding a question
        if (data.old_val == null) { questions.push(data.new_val); }
        else  {
            questions.forEach(function(q, i) {
                // Find the matching question
                if (q.id == data.old_val.id) {
                    // Deleting a question
                    if (data.new_val == null) { questions.$remove(i) }
                    // Updating the question
                    else { 
                        questions.$set(i, data.new_val)
                        // Get the child view for the question, and flash it
                        $q = $(app.list.$.question[i].$el)
                        $q.focus()
                    }
                }
            });
        }
    });
});

app = {
    vue: undefined,
    socket: undefined,

    // Add a question: push the question to the server
    addQuestion: function(questionText) {
        question = {
            question: questionText,
            points: 1,
        }
        app.socket.emit('new question', question);
    },

    upvoteQuestion: function(questionId) {
        app.socket.emit('upvote question', questionId);
    },

}
