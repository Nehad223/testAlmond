import React from "react";
import Card_Slider from "./Card_Slider";

const Cards = ({ meals = [], isAdmin, onDelete, onUpdateProduct, onAddToCart }) => {
  return (
    <div className="Cards">
      {meals.map((meal, index) => (
        <div key={meal.id} style={{ animationDelay: `${index * 60}ms` }}>
          <Card_Slider
            Id={meal.id}
            Title={meal.name}
            TitleEng={meal.englishName}
            Img={meal.image_url}
            PriceNumber={meal.price}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onUpdateProduct={onUpdateProduct}
            onAddToCart={onAddToCart}  // ← لازم هون
          />
        </div>
      ))}
    </div>
  );
};

export default Cards;

