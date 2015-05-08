app = {
    vue: undefined,
    socket: undefined,
    $epoch: undefined,
    questions: [],
    // Calculates the new data set, and redraws the Epoch chart
    update_epoch: function() {
        new_data = $.map(app.questions, function(question, i) {
            return {
                x: i,
                y: question.points
            }
        })
        this.$epoch.update([{
            label: 'series',
            values: new_data
        }]);
    }
}

// Time to get realtime
$(function() {
    app.socket = io.connect();

    // Create the Epoch instance
    app.$epoch = $('#chart').epoch({
        type: 'bar',
        data: app.questions,
    });

    // Load the inital data set, and draw the chart
    app.socket.on('load questions', function(data) {
        app.questions = data;
        app.update_epoch();
    });

    // Respond to updates on questions
    app.socket.on('questions', function(data) {
        // Adding a question
        if (data.old_val == null) { app.questions.push(data.new_val); }
        else  {
            app.questions.forEach(function(q, i) {
                // Find the matching question
                if (q.id == data.old_val.id) {
                    // Deleting a question
                    if (data.new_val == null) { app.questions.splice(i, 1) }
                    // Updating the question
                    else { app.questions[i] = data.new_val }
                }
            });
        }
        app.update_epoch();
    });
});

