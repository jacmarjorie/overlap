var main = function () {
    //
    $('#app_container').append($('<div>').attr('id', 'specificity_overlap'));
    
    this.selector = $('#specificity_overlap');

    this.load_button = $('#options_container').append($("<button class='btn btn-primary'>").attr('id', 'load_button').text("LOAD"));
    this.overlap_button = $('#options_container').append($("<button class='btn btn-primary'>").attr('id', 'overlap_button').text("OVERLAP").css('visibility', 'hidden'));
    this.connectors_one = [
      {source: "ONE", target: "TWO"},
      // {source: "TWO", target: "ONE"},
      {source: "ONE", target: "THREE"},
      // {source: "THREE", target: "ONE"},
      {source: "TWO", target: "THREE"},
      // {source: "THREE", target: "TWO"}
      {source: "ONE", target: "FOUR"},
      {source: "TWO", target: "FOUR"},
      {source: "THREE", target: "FOUR"}
    ];

    this.connectors_two = [
      {source: "ONE", target: "TWO_B"},
      // {source: "TWO", target: "ONE"},
      {source: "ONE", target: "THREE_B"},
      // {source: "THREE", target: "ONE"},
      {source: "TWO_B", target: "THREE_B"},
      // {source: "THREE", target: "TWO"}
      {source: "ONE", target: "FOUR_B"},
      {source: "TWO_B", target: "FOUR_B"},
      {source: "THREE_B", target: "FOUR_B"}
    ];

    this.specificity_overlap = new SpecificityOverlap(this.selector[0]);

    $('#load_button').click(this, function(event){
        var that = event.data;
        var second = false;
        $('#load_button').css('visibility', 'hidden');
        $('#overlap_button').css('visibility', 'visible');
        that.specificity_overlap.create_network(that.connectors_one, second);
        second = true;
        that.specificity_overlap.create_network(that.connectors_two, second);
    });

    $('#overlap_button').click(this, function(event){
        var that = event.data;
        console.log('registering a click')
        that.specificity_overlap.overlap_networks();
    });

};

$(document).ready(main);