var main = function () {
    //
    $('#app_container').append($('<div>').attr('id', 'specificity_overlap'));
    
    this.selector = $('#specificity_overlap');

    this.load_button = $('#options_container').append($("<button class='btn btn-primary'>").attr('id', 'load_button').text("LOAD"));
    this.overlap_button = $('#options_container').append($("<button class='btn btn-primary'>").attr('id', 'overlap_button').text("OVERLAP").css('visibility', 'hidden'));
    this.undo_overlap = $('#options_container').append($("<button class='btn btn-primary'>").attr('id', 'undo_overlap').text("SEPARATE").css('visibility', 'hidden'));

    this.connectors_one = [
      {source: "ONE", target: "TWO", distance: 5},
      // {source: "TWO", target: "ONE"},
      {source: "ONE", target: "THREE", distance: 6},
      // {source: "THREE", target: "ONE"},
      {source: "TWO", target: "THREE", distance: 10},
      // {source: "THREE", target: "TWO"}
      {source: "ONE", target: "FOUR", distance: 11},
      {source: "TWO", target: "FOUR", distance: 12},
      {source: "THREE", target: "FOUR", distance: 4}
    ];

    // one node

    // this.connectors_two = [
    //   {source: "ONE", target: "TWO_B", distance: 7},
    //   // {source: "TWO", target: "ONE"},
    //   {source: "ONE", target: "THREE_B", distance: 8},
    //   // {source: "THREE", target: "ONE"},
    //   {source: "TWO_B", target: "THREE_B", distance: 3},
    //   // {source: "THREE", target: "TWO"}
    //   {source: "ONE", target: "FOUR_B", distance: 15},
    //   {source: "TWO_B", target: "FOUR_B", distance: 12},
    //   {source: "THREE_B", target: "FOUR_B", distance: 2}
    // ];

    this.connectors_two = [
      {source: "ONE", target: "TWO_B", distance: 7},
      // {source: "TWO", target: "ONE"},
      {source: "ONE", target: "THREE", distance: 8},
      // {source: "THREE", target: "ONE"},
      {source: "TWO_B", target: "THREE", distance: 3},
      // {source: "THREE", target: "TWO"}
      {source: "ONE", target: "FOUR_B", distance: 15},
      {source: "TWO_B", target: "FOUR_B", distance: 12},
      {source: "THREE", target: "FOUR_B", distance: 2}
    ];

    this.specificity_overlap = new SpecificityOverlap(this.selector[0]);

    $('#load_button').click(this, function(event){
        var that = event.data;
        var second = false;
        $('#load_button').css('visibility', 'hidden');
        $('#overlap_button').css('visibility', 'visible');
        $('#undo_overlap').css('visibility', 'visible');
        that.specificity_overlap.create_network(that.connectors_one, second);
        second = true;
        that.specificity_overlap.create_network(that.connectors_two, second);
    });

    $('#overlap_button').click(this, function(event){
        var that = event.data;
        $("svg").empty();
        $('#undo_overlap')[0].disabled = false;
        $('#overlap_button')[0].disabled = true;
        that.specificity_overlap.overlap_networks();
    });

    $('#undo_overlap').click(this, function(event){
        var that = event.data;
        alert("UNDER CONSTRUCTION!")
        //var second = false;
        // $("svg").empty();
        // $('#overlap_button')[0].disabled = false;
        // $('#undo_overlap')[0].disabled = true;
        // that.specificity_overlap.create_network(that.connectors_one, second);
        // second = true;
        // that.specificity_overlap.create_network(that.connectors_two, second);
    })

};

$(document).ready(main);