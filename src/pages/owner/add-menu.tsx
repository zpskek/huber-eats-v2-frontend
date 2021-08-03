import React, { memo } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Button } from "../../components/button";
import { FormError } from "../../components/form-error";
import { FIND_MY_RESTAURANT } from "../../services/gqls/restaurant.gql";
import { useCreateDishMutation } from "../../services/dish.service";
import { CreateDish } from "../../__generated__/CreateDish";

interface IFormProps {
  name: string;
  price: number;
  description: string;
  file: FileList;
  [key: string]: string | number | FileList;
}

const AddMenu = memo(() => {
  const [uploading, setUploading] = useState<boolean>(false);
  const history = useHistory();
  const location = useLocation();
  const [_, restaurantId] = location.search.split("?restaurantId=");

  const [optionsNumber, setOptionsNumber] = useState<number[]>([]);

  const {
    register,
    getValues,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<IFormProps>({
    mode: "onChange",
  });

  const onCompleted = (data: CreateDish) => {
    history.push(`myRestaurant?restaurantId=${restaurantId}`);
  };

  const [createDishMutation, { data }] = useCreateDishMutation(onCompleted);
  const onSubmit = async () => {
    try {
      setUploading(true);
      const { name, price, description, file } = getValues();
      const actualFile = file[0];
      const formBody = new FormData();
      formBody.append("file", actualFile);
      const { url: coverImg } = await (
        await fetch("http://localhost:4000/uploads/", {
          method: "POST",
          body: formBody,
        })
      ).json();

      createDishMutation({
        variables: {
          input: {
            name,
            price: +price,
            photo: coverImg,
            description,
            restaurantId: +restaurantId,
          },
        },
        refetchQueries: [
          {
            query: FIND_MY_RESTAURANT,
            variables: {
              input: {
                id: +restaurantId,
              },
            },
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addOptionBtn = () => {
    setOptionsNumber((current) => [Date.now(), ...current]);
  };

  return (
    <div className="w-full flex justify-center min-h-screen pb-20">
      <Helmet>
        <title>Add Menu| Huber Eats</title>
      </Helmet>
      <div className="shadow-2xl border lg:w-1/3 py-10 flex min-h-screen flex-col justify-center items-center">
        <h4 className="font-semibold text-2xl mb-4">Add Menu</h4>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-3/4">
          <input
            {...register("name", {
              required: "Menu name is required",
            })}
            className="input"
            type="text"
            placeholder="Menu Name"
          />
          <input
            {...register("price", {
              required: "Menu price is required",
            })}
            className="input"
            min={0}
            type="number"
            placeholder="Menu Price"
          />
          <textarea
            {...register("description")}
            className="textarea"
            placeholder="Menu Description"
            rows={5}
          />
          <input {...register("file")} className="input" type="file" />
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-lg">Dish Option</h3>
              <button onClick={addOptionBtn} className="button bg-green-400">
                Add a Option
              </button>
            </div>
            <div className="flex flex-col input">
              {optionsNumber.length !== 0 &&
                optionsNumber.map((id) => (
                  <div>
                    <input
                      {...register(`${id}-optionName`, {
                        required: "Menu name is required",
                      })}
                      type="text"
                      placeholder="Option Name"
                    />
                    <input
                      {...register(`${id}-optionExtra`)}
                      type="number"
                      placeholder="Option Extra"
                    />
                  </div>
                ))}
            </div>
          </div>
          <Button
            canClick={isValid}
            actionText="Add Menu"
            loading={uploading}
          />
          {data?.createDish.error && (
            <FormError errorMessage={data.createDish.error} />
          )}
        </form>
        <button className="button bg-gray-400 mt-4 w-3/4">
          <Link to={`/myRestaurant?restaurantId=${restaurantId}`}>Back</Link>
        </button>
      </div>
    </div>
  );
});

export default AddMenu;
