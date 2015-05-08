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
        created: function() {
            this.$watch('questions', function() {
                // TODO update the sort function to include lexicographic ordering
                sorted = this.$.question.concat().sort(function(a,b) {
                    // First sort by points...
                    points = b.$get('points') - a.$get('points');
                    if (points != 0) { return points; }
                    // .. and then lexicographically (based on the question)
                    return a.question.localeCompare(b.question);

                });
                $.each(sorted, function(i, question) {
                    $(question.$el).css('top',(i*2.5)+'em');
                });
            })
        },
        methods: {
            upvoteQuestion: function(e) {
                e.preventDefault();
                app.upvoteQuestion(e.targetVM.$get('id'));
            },
        },
    });

    app.socket = io.connect();

    app.socket.on('load questions', function(data) {
        app.list.$set('questions', data);

    });

    app.socket.on('questions', function(data) {
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
                    else { questions.$set(i, data.new_val) }
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
